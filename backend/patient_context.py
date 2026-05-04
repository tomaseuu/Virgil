import json
from datetime import date, datetime


EXPECTED_PIPELINE_FIELDS = (
    "age",
    "IBD",
    "severity",
    "pregnant",
    "kidneys",
    "firstTreatment",
    "route",
    "drugs",
)

SEVERITY_RANK = {
    "mild": 1,
    "moderate": 2,
    "severe": 3,
}


def _pick_first(record, keys):
    if not record:
        return None

    for key in keys:
        value = record.get(key)
        if value is not None and value != "":
            return value
    return None


def _normalize_bool_like(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return None

    text = str(value).strip().lower()
    if text in {"true", "yes", "y", "1"}:
        return True
    if text in {"false", "no", "n", "0"}:
        return False
    return None


def _age_from_date(value):
    if not value:
        return None

    if isinstance(value, datetime):
        birth_date = value.date()
    elif isinstance(value, date):
        birth_date = value
    else:
        text = str(value).strip()
        try:
            birth_date = datetime.fromisoformat(text.replace("Z", "+00:00")).date()
        except ValueError:
            try:
                birth_date = datetime.strptime(text, "%Y-%m-%d").date()
            except ValueError:
                return None

    today = date.today()
    years = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        years -= 1
    return max(years, 0)


def normalize_age(profile, check_in):
    value = _pick_first(
        profile,
        ["age", "age_years", "years_old"],
    ) or _pick_first(check_in, ["age", "age_years", "years_old"])

    if value is not None:
        try:
            return str(int(float(value)))
        except (TypeError, ValueError):
            pass

    birth_value = _pick_first(
        profile,
        ["birth_date", "date_of_birth", "dob"],
    ) or _pick_first(check_in, ["birth_date", "date_of_birth", "dob"])
    derived_age = _age_from_date(birth_value)
    return str(derived_age) if derived_age is not None else ""


def normalize_ibd(profile, check_in):
    value = _pick_first(
        profile,
        ["IBD", "ibd", "ibd_type", "condition", "diagnosis"],
    ) or _pick_first(
        check_in,
        ["IBD", "ibd", "ibd_type", "condition", "diagnosis"],
    )

    if value is None:
        return "other"

    text = str(value).strip().lower()
    if "crohn" in text and "ulcer" in text:
        return "both"
    if "both" in text or "indeterminate" in text:
        return "both"
    if "crohn" in text:
        return "crohns"
    if "ulcer" in text or text == "uc":
        return "uc"
    return "other"


def normalize_pregnancy(profile, check_in):
    for record in (profile or {}, check_in or {}):
        breastfeeding = _normalize_bool_like(
            _pick_first(record, ["breastfeeding", "is_breastfeeding"])
        )
        if breastfeeding is True:
            return "breastfeeding"

        planning = _normalize_bool_like(
            _pick_first(
                record,
                ["planning_pregnancy", "is_planning_pregnancy", "trying_to_conceive"],
            )
        )
        if planning is True:
            return "planning"

        raw = _pick_first(
            record,
            ["pregnant", "pregnancy_status", "pregnancy", "is_pregnant"],
        )
        if raw is None:
            continue

        text = str(raw).strip().lower()
        if text in {"breastfeeding", "planning", "na"}:
            return text

        parsed = _normalize_bool_like(raw)
        if parsed is True:
            return "yes"
        if parsed is False:
            return "no"

    return "na"


def normalize_kidneys(profile, check_in):
    for record in (profile or {}, check_in or {}):
        raw = _pick_first(
            record,
            ["kidneys", "kidney_status", "kidney_history", "renal_history"],
        )
        if raw is not None:
            text = str(raw).strip().lower()
            if text in {"current", "past", "none"}:
                return text
            if "past" in text or "history" in text:
                return "past"
            if "current" in text or "active" in text:
                return "current"
            if text in {"no", "false", "n"}:
                return "none"

        boolean_like = _normalize_bool_like(
            _pick_first(record, ["has_kidney_issues", "kidney_issues"])
        )
        if boolean_like is True:
            return "current"
        if boolean_like is False:
            return "none"

    return "none"


def normalize_first_treatment(profile, check_in, medication_rows):
    for record in (profile or {}, check_in or {}):
        raw = _pick_first(
            record,
            ["firstTreatment", "first_treatment", "is_first_treatment"],
        )
        parsed = _normalize_bool_like(raw)
        if parsed is True:
            return "yes"
        if parsed is False:
            return "no"

    return "yes" if not normalize_drugs(medication_rows) else "no"


def normalize_route(profile, check_in):
    value = _pick_first(
        profile,
        ["route", "route_preference", "administration_route", "medication_route"],
    ) or _pick_first(
        check_in,
        ["route", "route_preference", "administration_route", "medication_route"],
    )

    if value is None:
        return "none"

    text = str(value).strip().lower().replace("-", "_").replace(" ", "_")
    direct_values = {
        "injection_prefer",
        "oral_prefer",
        "iv_prefer",
        "rectal_prefer",
        "injection_only",
        "oral_only",
        "iv_only",
        "rectal_only",
        "none",
    }
    if text in direct_values:
        return text

    if "inject" in text and "only" in text:
        return "injection_only"
    if "oral" in text and "only" in text:
        return "oral_only"
    if "iv" in text and "only" in text:
        return "iv_only"
    if "rectal" in text and "only" in text:
        return "rectal_only"
    if "inject" in text:
        return "injection_prefer"
    if "oral" in text:
        return "oral_prefer"
    if "iv" in text or "intraven" in text:
        return "iv_prefer"
    if "rectal" in text:
        return "rectal_prefer"
    return "none"


def _normalize_text_severity(value):
    if value is None:
        return None

    text = str(value).strip().lower()
    if text in SEVERITY_RANK:
        return text
    if "mild" in text:
        return "mild"
    if "moderate" in text or text == "medium":
        return "moderate"
    if "severe" in text or "high" in text:
        return "severe"
    return None


def _severity_from_numeric(values):
    if not values:
        return None

    max_value = max(values)
    if max_value <= 3:
        if max_value <= 1:
            return "mild"
        if max_value <= 2:
            return "moderate"
        return "severe"

    if max_value <= 10:
        if max_value <= 3:
            return "mild"
        if max_value <= 6:
            return "moderate"
        return "severe"

    if max_value <= 33:
        if max_value <= 11:
            return "mild"
        if max_value <= 22:
            return "moderate"
        return "severe"

    return "moderate"


def normalize_severity(profile, check_in, symptoms):
    for record in (check_in or {}, profile or {}):
        severity = _normalize_text_severity(
            _pick_first(record, ["severity", "ibd_severity", "symptom_severity"])
        )
        if severity:
            return severity

    text_severities = []
    numeric_values = []
    for row in symptoms or []:
        text_value = _normalize_text_severity(
            _pick_first(
                row,
                ["severity", "severity_label", "intensity_label", "level_label"],
            )
        )
        if text_value:
            text_severities.append(text_value)
            continue

        numeric_raw = _pick_first(
            row,
            ["severity", "score", "value", "intensity", "level", "rating"],
        )
        if numeric_raw is None:
            continue
        try:
            numeric_values.append(float(numeric_raw))
        except (TypeError, ValueError):
            continue

    if text_severities:
        return max(text_severities, key=lambda item: SEVERITY_RANK[item])

    derived = _severity_from_numeric(numeric_values)
    return derived or "moderate"


def normalize_reaction(value):
    if value is None:
        return ""

    text = str(value).strip().lower().replace(" ", "_")
    if text in {"better", "helped", "improved", "improvement"}:
        return "better"
    if text in {"worse", "bad", "worsened", "flare"}:
        return "worse"
    if text in {"no_change", "same", "neutral"}:
        return "no_change"
    return ""


def normalize_drugs(medication_rows):
    normalized = []
    seen = set()

    for row in medication_rows or []:
        drug = _pick_first(
            row,
            ["drug", "drug_name", "medication", "medication_name", "name"],
        )
        if not drug:
            continue

        drug_name = str(drug).strip()
        if not drug_name or drug_name.lower() in seen:
            continue

        seen.add(drug_name.lower())
        reaction = normalize_reaction(
            _pick_first(row, ["reaction", "response", "effect", "outcome"])
        )
        normalized.append({"drug": drug_name, "reaction": reaction})

    return normalized


def normalize_supabase_context_to_form_data(profile, check_in, symptoms, medication_rows):
    drugs = normalize_drugs(medication_rows)

    return {
        "age": normalize_age(profile, check_in),
        "IBD": normalize_ibd(profile, check_in),
        "severity": normalize_severity(profile, check_in, symptoms),
        "pregnant": normalize_pregnancy(profile, check_in),
        "kidneys": normalize_kidneys(profile, check_in),
        "firstTreatment": normalize_first_treatment(profile, check_in, medication_rows),
        "route": normalize_route(profile, check_in),
        "drugs": json.dumps(drugs),
    }


def merge_pipeline_form_data(base_form_data, override_form_data):
    merged = {field: "" for field in EXPECTED_PIPELINE_FIELDS}
    merged.update(base_form_data or {})

    override_form_data = override_form_data or {}
    for field in EXPECTED_PIPELINE_FIELDS:
        override_value = override_form_data.get(field)
        if override_value is None:
            continue
        if isinstance(override_value, str) and not override_value.strip():
            continue
        merged[field] = override_value

    merged["drugs"] = merged.get("drugs") or "[]"
    return merged
