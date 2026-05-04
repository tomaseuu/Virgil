Virgil

Tool to use genetic information to identify targeted treatment options for IBD.


Setup

Backend Setup (Python Flask)

* Make sure python is downloaded
1. Open a new terminal and navigate to the backend directory:
   cd backend
2. Create and activate a virtual environment:
   python -m venv venv
   - Windows:
     venv\Scripts\activate
   - macOS/Linux:
     source venv/bin/activate
3. Install backend dependencies:
   pip install -r requirements.txt
4. Set backend environment variables when using the shared Supabase integration:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` or `SUPABASE_API_KEY`
   - Optional for storage-backed genetics file retrieval:
     - `SUPABASE_PROFILE_DOCUMENTS_BUCKET` (default: `profile-documents`)
   - Optional if your `recommendations` table uses different column names:
     - `SUPABASE_RECOMMENDATION_CHECK_IN_COLUMN` (default: `check_in_id`)
     - `SUPABASE_RECOMMENDATION_USER_ID_COLUMN` (default: `user_id`)
     - `SUPABASE_RECOMMENDATION_TOP_GENE_COLUMN` (default: `top_gene`)
     - `SUPABASE_RECOMMENDATION_TOP_SCORE_COLUMN` (default: `top_score`)
     - `SUPABASE_RECOMMENDATION_BEST_DRUGS_COLUMN` (default: `best_drugs`)
     - `SUPABASE_RECOMMENDATION_ALTERNATIVES_COLUMN` (default: `alternatives`)
     - `SUPABASE_RECOMMENDATION_DESCRIPTION_COLUMN` (default: `description`)
     - `SUPABASE_RECOMMENDATION_FILTERED_OUT_DRUGS_COLUMN` (default: `filtered_out_drugs`)
     - `SUPABASE_RECOMMENDATION_USER_ID_SOURCE` (default: `profile_id`, alternate: `auth_user_id`)
     - `SUPABASE_RECOMMENDATION_DEBUG_PAYLOAD_COLUMN` (optional, no default)
     - `SUPABASE_RECOMMENDATION_SOURCE_COLUMN` (optional, no default)
     - `SUPABASE_RECOMMENDATION_SOURCE_VALUE` (default: `virgil_1_0`)
5. Run Flask backend
   python3 app.py
You can check this is running at http://localhost:5000.

Supabase-backed recommendation runs

The legacy `POST /upload` route still works with the original multipart form fields.
It now also accepts optional `profile_id` or `check_in_id` fields. When either ID is
provided, the backend fetches shared patient context from Supabase, maps it into the
legacy recommendation pipeline contract, and writes the final result to the shared
`recommendations` table using concrete fields such as `top_gene`, `best_drugs`, and
`alternatives`.

A second route, `POST /api/recommendations/run`, exposes the same behavior for cleaner
Virgil 2.0 integration.

Virgil 2.0 storage-backed trigger

Virgil 1.0 also supports a storage-backed trigger endpoint for genetics files already stored
in Supabase Storage:

`POST /api/recommendations/run-from-storage`

JSON body:
- `profile_id`
- `check_in_id` optional
- `genetics_document_id`
- `genetics_storage_path`

Assumptions in this flow:
- the storage bucket is `profile-documents` unless overridden by `SUPABASE_PROFILE_DOCUMENTS_BUCKET`
- the `profile_documents` row belongs to the provided `profile_id`
- the document `category` is `genetics`
- the provided `storage_path` matches the `profile_documents.storage_path`
- if `check_in_id` is omitted, Virgil 1.0 resolves the latest available check-in for the provided profile

Example curl:

```bash
curl -X POST http://127.0.0.1:5000/api/recommendations/run-from-storage \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "43a081cd-97d7-44d1-a917-57f1bbef3a89",
    "check_in_id": "ed8e7919-ba96-4801-94bd-d7b755bfbf6c",
    "genetics_document_id": "YOUR_DOCUMENT_ID",
    "genetics_storage_path": "YOUR/STORAGE/PATH.txt"
  }'
```

Latest-check-in example:

```bash
curl -X POST http://127.0.0.1:5000/api/recommendations/run-from-storage \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "43a081cd-97d7-44d1-a917-57f1bbef3a89",
    "genetics_document_id": "YOUR_DOCUMENT_ID",
    "genetics_storage_path": "YOUR/STORAGE/PATH.txt"
  }'
```

Schema verification and smoke test

Use the verifier to confirm the shared Supabase tables and expected recommendation columns:

`python3 verify_supabase_schema.py --check-in-id <shared-check-in-id>`

Pass conditions:
- all five shared tables are accessible
- the `recommendations` table exposes:
  - `check_in_id`
  - `user_id`
  - `top_gene`
  - `top_score`
  - `best_drugs`
  - `alternatives`
  - `description`
  - `filtered_out_drugs`
- the supplied `check_in_id` exists in `check_ins`

Live schema notes from verification:
- `recommendations.user_id` maps to `profiles.id`
- `check_ins.user_id` is the current shared linkage back to the profile row

Use the smoke test to run the real genetics pipeline and verify the inserted row shape:

`python3 smoke_test_recommendation.py --file /absolute/path/to/23andme.txt --check-in-id <shared-check-in-id>`

Optional:
- set `SUPABASE_RECOMMENDATION_USER_ID_SOURCE=auth_user_id` before running if the live schema verifier shows that `recommendations.user_id` should use `profiles.auth_user_id`

Frontend Setup (React)

* Make sure node.js is downloaded
1. Open a new terminal and navigate to the frontend directory:
   cd frontend
2. Install dependencies (if first time running):
   npm install
3. Run the development server:
   npm start
You can check this is running (and interact with the web app) at http://localhost:3000.
