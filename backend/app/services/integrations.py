"""
External API Integrations — Phase 6

Provides mood-aware recommendations from:
- Spotify Web API (music) — when keys are configured
- TMDB API (movies/shows) — when keys are configured
- Curated real dataset (Bollywood + Hollywood + Indie) — always available

Falls back to the comprehensive curated dataset when API keys are not configured.
"""

import httpx
from typing import Optional, List, Dict
from app.config import settings
from app.services.recommendations_data import pick_music, pick_movies, pick_wellness


# ── Spotify Integration ──

async def get_spotify_recommendations(mood: str, limit: int = 6) -> List[dict]:
    """Get mood-based music recommendations from Spotify or curated dataset."""
    if not settings.SPOTIFY_CLIENT_ID or not settings.SPOTIFY_CLIENT_SECRET:
        return pick_music(mood, limit)

    try:
        token = await _get_spotify_token()
        if not token:
            return pick_music(mood, limit)

        features = _mood_to_spotify_features(mood)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.spotify.com/v1/recommendations",
                headers={"Authorization": f"Bearer {token}"},
                params={
                    "limit": limit,
                    "seed_genres": features["genres"],
                    "target_valence": features["valence"],
                    "target_energy": features["energy"],
                    "target_tempo": features["tempo"],
                    "min_popularity": 40,
                },
                timeout=10,
            )

            if response.status_code != 200:
                return pick_music(mood, limit)

            data = response.json()
            tracks = []
            for track in data.get("tracks", [])[:limit]:
                artists = ", ".join(a["name"] for a in track.get("artists", []))
                tracks.append({
                    "type": "music",
                    "title": track.get("name", "Unknown"),
                    "subtitle": artists,
                    "source": "Spotify",
                    "url": track.get("external_urls", {}).get("spotify"),
                    "image": track.get("album", {}).get("images", [{}])[0].get("url") if track.get("album", {}).get("images") else None,
                    "preview_url": track.get("preview_url"),
                })
            return tracks

    except Exception as e:
        print(f"[WARN] Spotify API error: {e}")
        return pick_music(mood, limit)


async def _get_spotify_token() -> Optional[str]:
    """Get Spotify access token using client credentials flow."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://accounts.spotify.com/api/token",
                data={"grant_type": "client_credentials"},
                auth=(settings.SPOTIFY_CLIENT_ID, settings.SPOTIFY_CLIENT_SECRET),
                timeout=10,
            )
            if response.status_code == 200:
                return response.json().get("access_token")
    except Exception:
        pass
    return None


def _mood_to_spotify_features(mood: str) -> dict:
    """Map emotional state to Spotify audio feature targets."""
    mappings = {
        "happy":      {"valence": 0.85, "energy": 0.75, "tempo": 125, "genres": "pop,happy,dance"},
        "calm":       {"valence": 0.55, "energy": 0.25, "tempo": 80,  "genres": "ambient,chill,acoustic"},
        "sad":        {"valence": 0.20, "energy": 0.30, "tempo": 75,  "genres": "acoustic,indie,folk"},
        "anxious":    {"valence": 0.35, "energy": 0.20, "tempo": 70,  "genres": "ambient,classical,new-age"},
        "stressed":   {"valence": 0.40, "energy": 0.25, "tempo": 85,  "genres": "chill,ambient,study"},
        "burned_out": {"valence": 0.30, "energy": 0.15, "tempo": 65,  "genres": "ambient,sleep,classical"},
        "fatigued":   {"valence": 0.50, "energy": 0.45, "tempo": 100, "genres": "acoustic,indie-pop,folk"},
        "motivated":  {"valence": 0.80, "energy": 0.85, "tempo": 140, "genres": "electronic,workout,rock"},
    }
    return mappings.get(mood, mappings["calm"])


# ── TMDB Integration ──

async def get_tmdb_recommendations(mood: str, limit: int = 5) -> List[dict]:
    """Get mood-based movie recommendations from TMDB or curated dataset."""
    if not settings.TMDB_API_KEY:
        return pick_movies(mood, limit)

    try:
        genre_ids = _mood_to_tmdb_genres(mood)

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.themoviedb.org/3/discover/movie",
                params={
                    "api_key": settings.TMDB_API_KEY,
                    "sort_by": "popularity.desc",
                    "with_genres": ",".join(str(g) for g in genre_ids),
                    "vote_average.gte": 6.5,
                    "vote_count.gte": 100,
                    "page": 1,
                },
                timeout=10,
            )

            if response.status_code != 200:
                return pick_movies(mood, limit)

            data = response.json()
            movies = []
            for movie in data.get("results", [])[:limit]:
                movies.append({
                    "type": "movie",
                    "title": movie.get("title", "Unknown"),
                    "subtitle": movie.get("overview", "")[:100] + "...",
                    "source": "TMDB",
                    "url": f"https://www.themoviedb.org/movie/{movie.get('id')}",
                    "image": f"https://image.tmdb.org/t/p/w300{movie['poster_path']}" if movie.get("poster_path") else None,
                    "rating": movie.get("vote_average"),
                })
            return movies

    except Exception as e:
        print(f"[WARN] TMDB API error: {e}")
        return pick_movies(mood, limit)


def _mood_to_tmdb_genres(mood: str) -> List[int]:
    """Map emotional state to TMDB genre IDs."""
    mappings = {
        "happy":      [35, 12, 16, 10402],
        "calm":       [99, 36, 10751, 14],
        "sad":        [18, 10749, 16],
        "anxious":    [35, 16, 10751],
        "stressed":   [35, 12, 14],
        "burned_out": [35, 16, 10751, 14],
        "fatigued":   [35, 16, 10402],
        "motivated":  [28, 12, 18, 878],
    }
    return mappings.get(mood, mappings["calm"])


# ── Combined Recommendations ──

async def get_all_recommendations(mood: str) -> dict:
    """
    Get all recommendations for a given mood.
    Returns a diverse mix of music (Bollywood + Hollywood + Indie),
    movies (Bollywood + Hollywood), and wellness activities.
    """
    music = await get_spotify_recommendations(mood, limit=6)
    movies = await get_tmdb_recommendations(mood, limit=5)
    wellness = pick_wellness(mood, count=3)

    all_recs = music + movies + wellness

    return {
        "recommendations": all_recs,
        "mood_context": mood,
        "sources": {
            "music": "Spotify" if settings.SPOTIFY_CLIENT_ID else "Bollywood + Hollywood + Indie",
            "movies": "TMDB" if settings.TMDB_API_KEY else "Bollywood + Hollywood",
            "wellness": "MoodMeld",
        },
        "count": len(all_recs),
    }
