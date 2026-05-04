import os
from functools import lru_cache

from supabase import create_client


PROFILES_TABLE = "profiles"
CHECK_INS_TABLE = "check_ins"
SYMPTOMS_TABLE = "symptoms"
CHECK_IN_MEDICATIONS_TABLE = "check_in_medications"
RECOMMENDATIONS_TABLE = "recommendations"
PROFILE_DOCUMENTS_TABLE = "profile_documents"
PROFILE_DOCUMENTS_BUCKET = os.getenv(
    "SUPABASE_PROFILE_DOCUMENTS_BUCKET",
    "profile-documents",
)
CHECK_INS_PROFILE_LINK_COLUMNS = ("profile_id", "user_id")

RECOMMENDATION_CHECK_IN_COLUMN = os.getenv(
    "SUPABASE_RECOMMENDATION_CHECK_IN_COLUMN",
    "check_in_id",
)
RECOMMENDATION_USER_ID_COLUMN = os.getenv(
    "SUPABASE_RECOMMENDATION_USER_ID_COLUMN",
    "user_id",
)
RECOMMENDATION_TOP_GENE_COLUMN = os.getenv(
    "SUPABASE_RECOMMENDATION_TOP_GENE_COLUMN",
    "top_gene",
)
RECOMMENDATION_TOP_SCORE_COLUMN = os.getenv(
    "SUPABASE_RECOMMENDATION_TOP_SCORE_COLUMN",
    "top_score",
)
RECOMMENDATION_BEST_DRUGS_COLUMN = os.getenv(
    "SUPABASE_RECOMMENDATION_BEST_DRUGS_COLUMN",
    "best_drugs",
)
RECOMMENDATION_ALTERNATIVES_COLUMN = os.getenv(
    "SUPABASE_RECOMMENDATION_ALTERNATIVES_COLUMN",
    "alternatives",
)
RECOMMENDATION_DESCRIPTION_COLUMN = os.getenv(
    "SUPABASE_RECOMMENDATION_DESCRIPTION_COLUMN",
    "description",
)
RECOMMENDATION_FILTERED_OUT_DRUGS_COLUMN = os.getenv(
    "SUPABASE_RECOMMENDATION_FILTERED_OUT_DRUGS_COLUMN",
    "filtered_out_drugs",
)
RECOMMENDATION_DEBUG_PAYLOAD_COLUMN = os.getenv(
    "SUPABASE_RECOMMENDATION_DEBUG_PAYLOAD_COLUMN"
)
RECOMMENDATION_SOURCE_COLUMN = os.getenv(
    "SUPABASE_RECOMMENDATION_SOURCE_COLUMN"
)
RECOMMENDATION_SOURCE_VALUE = os.getenv(
    "SUPABASE_RECOMMENDATION_SOURCE_VALUE",
    "virgil_1_0",
)
RECOMMENDATION_USER_ID_SOURCE = os.getenv(
    "SUPABASE_RECOMMENDATION_USER_ID_SOURCE",
    "profile_id",
)


def supabase_is_configured():
    return bool(
        os.getenv("SUPABASE_URL")
        and (os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_API_KEY"))
    )


@lru_cache(maxsize=1)
def get_supabase_client():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_API_KEY")

    if not url or not key:
        raise RuntimeError(
            "Missing Supabase configuration. Set SUPABASE_URL and "
            "SUPABASE_SERVICE_KEY or SUPABASE_API_KEY."
        )

    return create_client(url, key)


def _first_row(response):
    if not response or not getattr(response, "data", None):
        return None
    return response.data[0]


def _rows(response):
    if not response or not getattr(response, "data", None):
        return []
    return response.data


def probe_table(table_name):
    response = get_supabase_client().table(table_name).select("*").limit(1).execute()
    return {
        "table": table_name,
        "accessible": True,
        "sample_row": _first_row(response),
        "row_count_hint": len(_rows(response)),
    }


def probe_table_columns(table_name, columns):
    results = {}
    client = get_supabase_client()

    for column in columns:
        try:
            response = client.table(table_name).select(column).limit(1).execute()
            results[column] = {
                "present": True,
                "sample_value": _first_row(response).get(column) if _first_row(response) else None,
            }
        except Exception as error:
            results[column] = {
                "present": False,
                "error": str(error),
            }

    return results


def fetch_profile(profile_id):
    if not profile_id:
        return None

    response = (
        get_supabase_client()
        .table(PROFILES_TABLE)
        .select("*")
        .eq("id", profile_id)
        .limit(1)
        .execute()
    )
    return _first_row(response)


def fetch_profiles(limit=100):
    response = (
        get_supabase_client()
        .table(PROFILES_TABLE)
        .select("*")
        .limit(limit)
        .execute()
    )
    return _rows(response)


def fetch_check_in(profile_id=None, check_in_id=None):
    client = get_supabase_client()

    if check_in_id:
        response = (
            client.table(CHECK_INS_TABLE)
            .select("*")
            .eq("id", check_in_id)
            .limit(1)
            .execute()
        )
        return _first_row(response)

    if not profile_id:
        return None

    for link_column in CHECK_INS_PROFILE_LINK_COLUMNS:
        for order_column in ("created_at", "updated_at", "id"):
            try:
                response = (
                    client.table(CHECK_INS_TABLE)
                    .select("*")
                    .eq(link_column, profile_id)
                    .order(order_column, desc=True)
                    .limit(1)
                    .execute()
                )
                if getattr(response, "data", None):
                    return response.data[0]
            except Exception:
                continue

        try:
            response = (
                client.table(CHECK_INS_TABLE)
                .select("*")
                .eq(link_column, profile_id)
                .limit(1)
                .execute()
            )
            row = _first_row(response)
            if row:
                return row
        except Exception:
            continue

    return None


def fetch_check_ins(limit=100):
    client = get_supabase_client()
    for order_column in ("created_at", "updated_at", "id"):
        try:
            response = (
                client.table(CHECK_INS_TABLE)
                .select("*")
                .order(order_column, desc=True)
                .limit(limit)
                .execute()
            )
            return _rows(response)
        except Exception:
            continue

    response = (
        client.table(CHECK_INS_TABLE)
        .select("*")
        .limit(limit)
        .execute()
    )
    return _rows(response)


def fetch_symptoms(check_in_id):
    if not check_in_id:
        return []

    client = get_supabase_client()
    for order_column in ("created_at", "updated_at", "id"):
        try:
            response = (
                client.table(SYMPTOMS_TABLE)
                .select("*")
                .eq("check_in_id", check_in_id)
                .order(order_column)
                .execute()
            )
            return response.data or []
        except Exception:
            continue

    response = (
        client.table(SYMPTOMS_TABLE)
        .select("*")
        .eq("check_in_id", check_in_id)
        .execute()
    )
    return response.data or []


def fetch_check_in_medications(check_in_id):
    if not check_in_id:
        return []

    client = get_supabase_client()
    for order_column in ("created_at", "updated_at", "id"):
        try:
            response = (
                client.table(CHECK_IN_MEDICATIONS_TABLE)
                .select("*")
                .eq("check_in_id", check_in_id)
                .order(order_column)
                .execute()
            )
            return response.data or []
        except Exception:
            continue

    response = (
        client.table(CHECK_IN_MEDICATIONS_TABLE)
        .select("*")
        .eq("check_in_id", check_in_id)
        .execute()
    )
    return response.data or []


def fetch_profile_document(document_id=None, profile_id=None, storage_path=None):
    if not document_id and not storage_path:
        return None

    query = get_supabase_client().table(PROFILE_DOCUMENTS_TABLE).select("*")
    if document_id:
        query = query.eq("id", document_id)
    if profile_id:
        query = query.eq("profile_id", profile_id)
    if storage_path:
        query = query.eq("storage_path", storage_path)

    response = query.limit(1).execute()
    return _first_row(response)


def download_profile_document(storage_path):
    if not storage_path:
        raise ValueError("Missing genetics storage path.")

    try:
        return get_supabase_client().storage.from_(PROFILE_DOCUMENTS_BUCKET).download(storage_path)
    except Exception as error:
        raise FileNotFoundError(
            f"Could not download genetics file from storage path '{storage_path}': {error}"
        ) from error


def fetch_recommendation_by_id(recommendation_id):
    if not recommendation_id:
        return None

    response = (
        get_supabase_client()
        .table(RECOMMENDATIONS_TABLE)
        .select("*")
        .eq("id", recommendation_id)
        .limit(1)
        .execute()
    )
    return _first_row(response)


def fetch_recommendations(limit=100):
    client = get_supabase_client()
    for order_column in ("created_at", "updated_at", "id"):
        try:
            response = (
                client.table(RECOMMENDATIONS_TABLE)
                .select("*")
                .order(order_column, desc=True)
                .limit(limit)
                .execute()
            )
            return _rows(response)
        except Exception:
            continue

    response = (
        client.table(RECOMMENDATIONS_TABLE)
        .select("*")
        .limit(limit)
        .execute()
    )
    return _rows(response)


def fetch_latest_recommendation_for_check_in(check_in_id):
    if not check_in_id:
        return None

    client = get_supabase_client()
    for order_column in ("created_at", "updated_at", "id"):
        try:
            response = (
                client.table(RECOMMENDATIONS_TABLE)
                .select("*")
                .eq(RECOMMENDATION_CHECK_IN_COLUMN, check_in_id)
                .order(order_column, desc=True)
                .limit(1)
                .execute()
            )
            row = _first_row(response)
            if row:
                return row
        except Exception:
            continue

    response = (
        client.table(RECOMMENDATIONS_TABLE)
        .select("*")
        .eq(RECOMMENDATION_CHECK_IN_COLUMN, check_in_id)
        .limit(1)
        .execute()
    )
    return _first_row(response)


def resolve_recommendation_user_id(profile=None, profile_id=None):
    if RECOMMENDATION_USER_ID_SOURCE == "auth_user_id":
        if profile and profile.get("auth_user_id"):
            return profile.get("auth_user_id")
        return profile_id

    if profile_id:
        return profile_id
    if profile:
        return profile.get("id") or profile.get("auth_user_id")
    return None


def insert_recommendation(
    *,
    profile=None,
    profile_id=None,
    check_in_id=None,
    top_gene="",
    top_score=0,
    best_drugs=None,
    alternatives=None,
    description="",
    filtered_out_drugs=None,
    debug_payload=None,
):
    user_id = resolve_recommendation_user_id(profile=profile, profile_id=profile_id)

    row = {
        RECOMMENDATION_TOP_GENE_COLUMN: top_gene or "",
        RECOMMENDATION_TOP_SCORE_COLUMN: top_score or 0,
        RECOMMENDATION_BEST_DRUGS_COLUMN: best_drugs or [],
        RECOMMENDATION_ALTERNATIVES_COLUMN: alternatives or [],
        RECOMMENDATION_DESCRIPTION_COLUMN: description or "",
        RECOMMENDATION_FILTERED_OUT_DRUGS_COLUMN: filtered_out_drugs or [],
    }

    if user_id:
        row[RECOMMENDATION_USER_ID_COLUMN] = user_id
    if check_in_id:
        row[RECOMMENDATION_CHECK_IN_COLUMN] = check_in_id
    if RECOMMENDATION_DEBUG_PAYLOAD_COLUMN:
        row[RECOMMENDATION_DEBUG_PAYLOAD_COLUMN] = debug_payload or {}
    if RECOMMENDATION_SOURCE_COLUMN:
        row[RECOMMENDATION_SOURCE_COLUMN] = RECOMMENDATION_SOURCE_VALUE

    response = (
        get_supabase_client()
        .table(RECOMMENDATIONS_TABLE)
        .insert(row)
        .execute()
    )
    return _first_row(response)
