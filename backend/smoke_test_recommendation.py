import argparse
import io
import json
import os

from werkzeug.datastructures import FileStorage

from app import run_recommendation_pipeline
from supabase_client import (
    RECOMMENDATION_ALTERNATIVES_COLUMN,
    RECOMMENDATION_BEST_DRUGS_COLUMN,
    RECOMMENDATION_CHECK_IN_COLUMN,
    RECOMMENDATION_DESCRIPTION_COLUMN,
    RECOMMENDATION_FILTERED_OUT_DRUGS_COLUMN,
    RECOMMENDATION_TOP_GENE_COLUMN,
    RECOMMENDATION_TOP_SCORE_COLUMN,
    RECOMMENDATION_USER_ID_COLUMN,
    fetch_latest_recommendation_for_check_in,
    fetch_recommendation_by_id,
    supabase_is_configured,
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


def load_upload(path):
    filename = os.path.basename(path)
    with open(path, "rb") as handle:
        contents = handle.read()

    return FileStorage(
        stream=io.BytesIO(contents),
        filename=filename,
        name="file",
        content_type="text/plain",
    )


def validate_recommendation_row(row):
    if not row:
        return {
            "passed": False,
            "reason": "No recommendation row was found after the pipeline run.",
        }

    missing_columns = [
        column for column in EXPECTED_RECOMMENDATION_COLUMNS if column not in row
    ]
    if missing_columns:
        return {
            "passed": False,
            "reason": "Recommendation row is missing expected columns.",
            "missing_columns": missing_columns,
        }

    return {
        "passed": True,
        "reason": "Recommendation row contains all expected shared-schema columns.",
    }


def main():
    parser = argparse.ArgumentParser(
        description="Run a practical end-to-end smoke test for the Virgil 1.0 Supabase integration."
    )
    parser.add_argument("--file", required=True, help="Path to a real 23andMe raw data file.")
    parser.add_argument("--check-in-id", help="Shared check_in_id to use for the run.")
    parser.add_argument("--profile-id", help="Shared profile_id to use for the run.")
    args = parser.parse_args()

    if not args.check_in_id and not args.profile_id:
        raise SystemExit("Pass either --check-in-id or --profile-id.")

    if not supabase_is_configured():
        raise SystemExit(
            "Missing Supabase configuration. Set SUPABASE_URL and "
            "SUPABASE_SERVICE_KEY or SUPABASE_API_KEY before running this smoke test."
        )

    uploaded_file = load_upload(args.file)
    response = run_recommendation_pipeline(
        uploaded_file,
        request_form_data={},
        profile_id=args.profile_id,
        check_in_id=args.check_in_id,
    )

    recommendation_id = response.get("recommendation_id")
    if recommendation_id:
        inserted_row = fetch_recommendation_by_id(recommendation_id)
    else:
        inserted_row = fetch_latest_recommendation_for_check_in(response.get("check_in_id"))

    validation = validate_recommendation_row(inserted_row)

    print(
        json.dumps(
            {
                "pipeline_response": response,
                "inserted_recommendation_row": inserted_row,
                "validation": validation,
            },
            indent=2,
            default=str,
        )
    )

    if not validation["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
