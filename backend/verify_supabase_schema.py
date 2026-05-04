import argparse
import json
import sys

from supabase_client import (
    CHECK_IN_MEDICATIONS_TABLE,
    CHECK_INS_TABLE,
    PROFILES_TABLE,
    RECOMMENDATIONS_TABLE,
    RECOMMENDATION_ALTERNATIVES_COLUMN,
    RECOMMENDATION_BEST_DRUGS_COLUMN,
    RECOMMENDATION_CHECK_IN_COLUMN,
    RECOMMENDATION_DESCRIPTION_COLUMN,
    RECOMMENDATION_FILTERED_OUT_DRUGS_COLUMN,
    RECOMMENDATION_TOP_GENE_COLUMN,
    RECOMMENDATION_TOP_SCORE_COLUMN,
    RECOMMENDATION_USER_ID_COLUMN,
    SYMPTOMS_TABLE,
    fetch_check_in,
    fetch_profiles,
    fetch_recommendations,
    probe_table,
    probe_table_columns,
    supabase_is_configured,
)


EXPECTED_TABLES = (
    PROFILES_TABLE,
    CHECK_INS_TABLE,
    SYMPTOMS_TABLE,
    CHECK_IN_MEDICATIONS_TABLE,
    RECOMMENDATIONS_TABLE,
)

EXPECTED_RECOMMENDATION_COLUMNS = (
    RECOMMENDATION_CHECK_IN_COLUMN,
    RECOMMENDATION_USER_ID_COLUMN,
    RECOMMENDATION_TOP_GENE_COLUMN,
    RECOMMENDATION_TOP_SCORE_COLUMN,
    RECOMMENDATION_BEST_DRUGS_COLUMN,
    RECOMMENDATION_ALTERNATIVES_COLUMN,
    RECOMMENDATION_DESCRIPTION_COLUMN,
    RECOMMENDATION_FILTERED_OUT_DRUGS_COLUMN,
)

EXPECTED_PROFILE_COLUMNS = (
    "id",
    "auth_user_id",
)

EXPECTED_CHECK_IN_COLUMNS = (
    "id",
    "user_id",
)

EXPECTED_SYMPTOM_COLUMNS = (
    "check_in_id",
)

EXPECTED_MEDICATION_COLUMNS = (
    "check_in_id",
)


def infer_user_id_mapping(profiles, recommendations):
    profile_ids = {str(row["id"]) for row in profiles if row.get("id") is not None}
    auth_user_ids = {
        str(row["auth_user_id"])
        for row in profiles
        if row.get("auth_user_id") is not None
    }

    user_ids = [
        str(row.get(RECOMMENDATION_USER_ID_COLUMN))
        for row in recommendations
        if row.get(RECOMMENDATION_USER_ID_COLUMN) is not None
    ]

    if not user_ids:
        return {
            "status": "inconclusive",
            "reason": "No existing recommendations rows with user_id were found.",
        }

    profile_matches = sum(1 for value in user_ids if value in profile_ids)
    auth_matches = sum(1 for value in user_ids if value in auth_user_ids)

    if profile_matches == 0 and auth_matches == 0:
        return {
            "status": "inconclusive",
            "reason": "Existing recommendation.user_id values did not match sampled profiles.id or profiles.auth_user_id values.",
            "profile_matches": profile_matches,
            "auth_user_id_matches": auth_matches,
        }

    if profile_matches > auth_matches:
        return {
            "status": "profile_id",
            "reason": "More recommendation.user_id values matched profiles.id than profiles.auth_user_id.",
            "profile_matches": profile_matches,
            "auth_user_id_matches": auth_matches,
        }

    if auth_matches > profile_matches:
        return {
            "status": "auth_user_id",
            "reason": "More recommendation.user_id values matched profiles.auth_user_id than profiles.id.",
            "profile_matches": profile_matches,
            "auth_user_id_matches": auth_matches,
        }

    return {
        "status": "inconclusive",
        "reason": "Matches were tied between profiles.id and profiles.auth_user_id.",
        "profile_matches": profile_matches,
        "auth_user_id_matches": auth_matches,
    }


def verify_check_in_linkage(check_in_id):
    if not check_in_id:
        return {
            "status": "skipped",
            "reason": "No check_in_id was provided for linkage verification.",
        }

    check_in = fetch_check_in(check_in_id=check_in_id)
    if not check_in:
        return {
            "status": "failed",
            "reason": f"check_in_id {check_in_id} was not found in the shared check_ins table.",
        }

    return {
        "status": "passed",
        "reason": "The provided check_in_id exists in the shared check_ins table.",
        "profile_id": check_in.get("profile_id") or check_in.get("user_id"),
    }


def main():
    parser = argparse.ArgumentParser(
        description="Verify Virgil shared Supabase schema assumptions."
    )
    parser.add_argument("--check-in-id", help="Optional shared check_in_id to verify.")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON.")
    args = parser.parse_args()

    if not supabase_is_configured():
        raise SystemExit(
            "Missing Supabase configuration. Set SUPABASE_URL and "
            "SUPABASE_SERVICE_KEY or SUPABASE_API_KEY before running this verifier."
        )

    report = {
        "tables": {},
        "columns": {},
        "linkage": {},
    }

    for table_name in EXPECTED_TABLES:
        try:
            report["tables"][table_name] = probe_table(table_name)
        except Exception as error:
            report["tables"][table_name] = {
                "table": table_name,
                "accessible": False,
                "error": str(error),
            }

    column_checks = {
        PROFILES_TABLE: EXPECTED_PROFILE_COLUMNS,
        CHECK_INS_TABLE: EXPECTED_CHECK_IN_COLUMNS,
        SYMPTOMS_TABLE: EXPECTED_SYMPTOM_COLUMNS,
        CHECK_IN_MEDICATIONS_TABLE: EXPECTED_MEDICATION_COLUMNS,
        RECOMMENDATIONS_TABLE: EXPECTED_RECOMMENDATION_COLUMNS,
    }

    for table_name, columns in column_checks.items():
        try:
            report["columns"][table_name] = probe_table_columns(table_name, columns)
        except Exception as error:
            report["columns"][table_name] = {
                "__probe_error__": {
                    "present": False,
                    "error": str(error),
                }
            }

    try:
        profiles = fetch_profiles(limit=200)
        recommendations = fetch_recommendations(limit=200)
        report["linkage"]["user_id_mapping"] = infer_user_id_mapping(
            profiles,
            recommendations,
        )
    except Exception as error:
        report["linkage"]["user_id_mapping"] = {
            "status": "inconclusive",
            "reason": f"Could not sample existing recommendations/profile rows: {error}",
        }

    try:
        report["linkage"]["check_in"] = verify_check_in_linkage(args.check_in_id)
    except Exception as error:
        report["linkage"]["check_in"] = {
            "status": "failed",
            "reason": str(error),
        }

    if args.json:
        print(json.dumps(report, indent=2, default=str))
        return

    print(json.dumps(report, indent=2, default=str))

    table_failures = [
        name for name, result in report["tables"].items() if not result.get("accessible")
    ]
    column_failures = []
    for table_name, columns in report["columns"].items():
        for column_name, details in columns.items():
            if not details.get("present"):
                column_failures.append(f"{table_name}.{column_name}")

    if table_failures or column_failures:
        print("\nFAIL")
        if table_failures:
            print("Missing/inaccessible tables:")
            for table_name in table_failures:
                print(f"- {table_name}")
        if column_failures:
            print("Missing columns:")
            for column_name in column_failures:
                print(f"- {column_name}")
        sys.exit(1)

    print("\nPASS")


if __name__ == "__main__":
    main()
