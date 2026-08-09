import httpx

base = "http://127.0.0.1:8000"


def main() -> None:
    print("health", httpx.get(f"{base}/health").json())
    tok = httpx.post(
        f"{base}/api/v1/auth/login",
        json={"email": "admin@lsi.os", "password": "demo1234"},
    ).json()["access_token"]
    h = {"Authorization": f"Bearer {tok}"}
    print("docs", len(httpx.get(f"{base}/api/v1/knowledge/documents", headers=h).json()))
    job = httpx.post(
        f"{base}/api/v1/agents/jobs",
        headers=h,
        json={"name": "Safety sweep", "agent_type": "safety", "query": "aspirin colitis"},
        timeout=90,
    )
    print("agent", job.status_code, job.json().get("status"))
    wfs = httpx.get(f"{base}/api/v1/workflows", headers=h).json()
    print("workflows", len(wfs))
    if wfs:
        run = httpx.post(f"{base}/api/v1/workflows/{wfs[0]['id']}/run", headers=h, timeout=60)
        print("run", run.status_code, run.json().get("status"), len(run.json().get("step_results", [])))
    print("audit", len(httpx.get(f"{base}/api/v1/admin/audit", headers=h).json()))
    print("SMOKE OK")


if __name__ == "__main__":
    main()
