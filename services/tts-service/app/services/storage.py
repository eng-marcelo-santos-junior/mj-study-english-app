import asyncio

from supabase import create_client


async def upload_audio(
    audio: bytes,
    storage_path: str,
    bucket: str,
    supabase_url: str,
    supabase_key: str,
) -> str:
    """Upload audio bytes to Supabase Storage and return a long-lived signed URL."""

    def _sync() -> str:
        client = create_client(supabase_url, supabase_key)
        client.storage.from_(bucket).upload(
            path=storage_path,
            file=audio,
            file_options={"contentType": "audio/mpeg", "upsert": "true"},
        )
        result = client.storage.from_(bucket).create_signed_url(
            storage_path,
            # 1 year in seconds
            60 * 60 * 24 * 365,
        )
        # supabase-py v2 returns a dict; key varies between minor versions
        if isinstance(result, dict):
            signed_url = result.get("signedURL") or result.get("signedUrl") or ""
        else:
            signed_url = getattr(result, "signed_url", "") or str(result)

        if not signed_url:
            raise RuntimeError("Supabase did not return a signed URL")
        return signed_url

    return await asyncio.to_thread(_sync)
