// Thin fetch wrapper that attaches the Firebase ID token to every request
// and centralizes error handling for the whole app.
export function makeApi(getToken) {
  async function request(path, { method = "GET", body, isFormData = false } = {}) {
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };
    if (!isFormData) headers["Content-Type"] = "application/json";

    const res = await fetch(`/api${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || "Request failed");
    }
    return res.json();
  }

  return {
    getProfile: () => request("/user/profile"),
    saveProfile: (profile) => request("/user/profile", { method: "PUT", body: profile }),
    generatePlan: () => request("/plan/generate", { method: "POST" }),
    getLatestPlan: () => request("/plan/latest"),
    generateDiet: () => request("/diet/generate", { method: "POST" }),
    getLatestDiet: () => request("/diet/latest"),
    analyzeFood: (formData) => request("/food/analyze", { method: "POST", body: formData, isFormData: true }),
    getTodayFood: () => request("/food/today"),
    askCoach: (message) => request("/chat/ask", { method: "POST", body: { message } }),
  };
}
