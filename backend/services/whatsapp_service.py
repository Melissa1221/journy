"""
WhatsApp Integration Service for Journi

Handles:
- Twilio webhook processing
- Message sending via Twilio API
- User <-> Trip mapping
- Media download from Twilio
- Audio transcription with Whisper
"""

import os
import httpx
import base64
import tempfile
from typing import Optional
from dataclasses import dataclass
from twilio.rest import Client
from twilio.request_validator import RequestValidator
from openai import AsyncOpenAI

# Twilio configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", "+14155238886")


@dataclass
class WhatsAppMessage:
    """Parsed incoming WhatsApp message."""
    from_number: str  # e.g., "whatsapp:+51999888777"
    body: str
    num_media: int = 0
    media_urls: list[str] = None
    media_types: list[str] = None
    profile_name: Optional[str] = None

    @property
    def phone_number(self) -> str:
        """Extract clean phone number without 'whatsapp:' prefix."""
        return self.from_number.replace("whatsapp:", "")

    @property
    def display_name(self) -> str:
        """Get display name or last 4 digits of phone."""
        if self.profile_name:
            return self.profile_name
        return self.phone_number[-4:]


@dataclass
class WhatsAppUser:
    """WhatsApp user with trip association."""
    phone_number: str
    display_name: str
    active_trip_id: Optional[int] = None
    active_session_code: Optional[str] = None


class WhatsAppService:
    """Service for WhatsApp integration via Twilio."""

    def __init__(self):
        self.client = None
        self.validator = None
        self._init_client()
        # In-memory user store (replace with DB later)
        self._users: dict[str, WhatsAppUser] = {}

    def _init_client(self):
        """Initialize Twilio client if credentials are available."""
        if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
            self.client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            self.validator = RequestValidator(TWILIO_AUTH_TOKEN)
            print(f"WhatsApp service initialized (number: {TWILIO_WHATSAPP_NUMBER})")
        else:
            print("WhatsApp service not configured (missing TWILIO credentials)")

    def is_configured(self) -> bool:
        """Check if Twilio is properly configured."""
        return self.client is not None

    def validate_request(self, url: str, params: dict, signature: str) -> bool:
        """Validate that request came from Twilio."""
        if not self.validator:
            return False
        return self.validator.validate(url, params, signature)

    def parse_webhook(self, form_data: dict) -> WhatsAppMessage:
        """Parse incoming Twilio webhook data into WhatsAppMessage."""
        num_media = int(form_data.get("NumMedia", 0))
        media_urls = []
        media_types = []

        for i in range(num_media):
            url = form_data.get(f"MediaUrl{i}")
            content_type = form_data.get(f"MediaContentType{i}")
            if url:
                media_urls.append(url)
                media_types.append(content_type or "application/octet-stream")

        return WhatsAppMessage(
            from_number=form_data.get("From", ""),
            body=form_data.get("Body", ""),
            num_media=num_media,
            media_urls=media_urls,
            media_types=media_types,
            profile_name=form_data.get("ProfileName")
        )

    async def download_media(self, media_url: str) -> tuple[bytes, str]:
        """Download media from Twilio URL.

        Returns:
            Tuple of (bytes, content_type)
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                media_url,
                auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
                follow_redirects=True
            )
            response.raise_for_status()
            return response.content, response.headers.get("content-type", "application/octet-stream")

    async def download_media_as_base64(self, media_url: str) -> tuple[str, str]:
        """Download media and return as base64 string.

        Returns:
            Tuple of (base64_string, content_type)
        """
        data, content_type = await self.download_media(media_url)
        return base64.b64encode(data).decode("utf-8"), content_type

    async def transcribe_audio(self, media_url: str) -> str:
        """Download audio from Twilio and transcribe with OpenAI Whisper.

        Args:
            media_url: Twilio media URL for the audio file

        Returns:
            Transcribed text from the audio
        """
        # Download the audio file
        audio_data, content_type = await self.download_media(media_url)

        # Determine file extension from content type
        ext_map = {
            "audio/ogg": ".ogg",
            "audio/mpeg": ".mp3",
            "audio/mp4": ".m4a",
            "audio/wav": ".wav",
            "audio/webm": ".webm",
            "audio/x-m4a": ".m4a",
        }
        ext = ext_map.get(content_type, ".ogg")

        # Write to temp file (Whisper API requires file upload)
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name

        try:
            # Transcribe with OpenAI Whisper
            openai_client = AsyncOpenAI()
            with open(tmp_path, "rb") as audio_file:
                transcription = await openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="es"  # Spanish - can be made dynamic
                )
            return transcription.text
        finally:
            # Clean up temp file
            import os as os_module
            os_module.unlink(tmp_path)

    @staticmethod
    def is_image_type(content_type: str) -> bool:
        """Check if content type is an image."""
        return content_type.startswith("image/")

    @staticmethod
    def is_audio_type(content_type: str) -> bool:
        """Check if content type is audio."""
        return content_type.startswith("audio/")

    async def send_message(
        self,
        to_number: str,
        body: str,
        media_url: Optional[str] = None
    ) -> bool:
        """Send WhatsApp message via Twilio.

        Args:
            to_number: Phone number (with or without whatsapp: prefix)
            body: Message text
            media_url: Optional public URL for image/media

        Returns:
            True if sent successfully
        """
        if not self.client:
            print("Cannot send message: Twilio not configured")
            return False

        # Ensure whatsapp: prefix
        if not to_number.startswith("whatsapp:"):
            to_number = f"whatsapp:{to_number}"

        from_number = f"whatsapp:{TWILIO_WHATSAPP_NUMBER}"

        try:
            kwargs = {
                "body": body,
                "from_": from_number,
                "to": to_number
            }
            if media_url:
                kwargs["media_url"] = [media_url]

            message = self.client.messages.create(**kwargs)
            print(f"WhatsApp message sent: {message.sid}")
            return True
        except Exception as e:
            print(f"Failed to send WhatsApp message: {e}")
            return False

    # ============== USER MANAGEMENT ==============

    def get_user(self, phone_number: str) -> Optional[WhatsAppUser]:
        """Get user by phone number."""
        # Normalize phone number
        phone = phone_number.replace("whatsapp:", "")
        return self._users.get(phone)

    def create_or_update_user(
        self,
        phone_number: str,
        display_name: str,
        trip_id: Optional[int] = None,
        session_code: Optional[str] = None
    ) -> WhatsAppUser:
        """Create or update WhatsApp user."""
        phone = phone_number.replace("whatsapp:", "")
        user = WhatsAppUser(
            phone_number=phone,
            display_name=display_name,
            active_trip_id=trip_id,
            active_session_code=session_code
        )
        self._users[phone] = user
        return user

    def set_user_trip(self, phone_number: str, trip_id: int, session_code: str) -> bool:
        """Associate user with a trip."""
        phone = phone_number.replace("whatsapp:", "")
        user = self._users.get(phone)
        if user:
            user.active_trip_id = trip_id
            user.active_session_code = session_code
            return True
        return False


# Singleton instance
_whatsapp_service: Optional[WhatsAppService] = None


def get_whatsapp_service() -> WhatsAppService:
    """Get or create WhatsApp service singleton."""
    global _whatsapp_service
    if _whatsapp_service is None:
        _whatsapp_service = WhatsAppService()
    return _whatsapp_service
