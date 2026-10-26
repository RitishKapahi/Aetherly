import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCitySearch } from "./useCitySearch.js";

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("useCitySearch", () => {
  it("debounces a query and returns matching locations", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [{ id: "2643743", name: "London", country: "United Kingdom" }] }) });
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useCitySearch("London"));
    expect(fetchMock).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(260); });
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].name).toBe("London");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows a useful error for a failed search", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network failure")));
    const { result } = renderHook(() => useCitySearch("Paris"));
    await waitFor(() => expect(result.current.error).toMatch(/reach Aetherly/i), { timeout: 1500 });
    expect(result.current.results).toEqual([]);
  });

  it("clears prior suggestions while a new query is waiting to run", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: "london", name: "London" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: "paris", name: "Paris" }] }) });
    vi.stubGlobal("fetch", fetchMock);
    const { result, rerender } = renderHook(({ query }) => useCitySearch(query), { initialProps: { query: "London" } });
    await act(async () => { await vi.advanceTimersByTimeAsync(260); });
    expect(result.current.results[0]?.name).toBe("London");

    rerender({ query: "Paris" });
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(260); });
    expect(result.current.results[0]?.name).toBe("Paris");
  });
});
