import { renderHook, act } from "@testing-library/react";
import { useAutoLock } from "@/hooks/useAutoLock";
import { useWalletStore } from "@/store/useWalletStore";

const mockLock = jest.fn();

jest.mock("@/store/useWalletStore", () => ({
  useWalletStore: jest.fn(),
}));

const mockUseWalletStore = useWalletStore as jest.MockedFunction<typeof useWalletStore>;

function buildStore(overrides: { isLocked?: boolean; lockTimeout?: number } = {}) {
  return {
    isLocked: overrides.isLocked ?? false,
    settings: { lockTimeout: overrides.lockTimeout ?? 5, defaultNetwork: "sepolia" as const },
    lock: mockLock,
  } as ReturnType<typeof useWalletStore>;
}

describe("useAutoLock", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockLock.mockClear();
    mockUseWalletStore.mockReturnValue(buildStore());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls lock() after lockTimeout minutes of inactivity", () => {
    mockUseWalletStore.mockReturnValue(buildStore({ lockTimeout: 1 }));
    renderHook(() => useAutoLock());

    act(() => {
      jest.advanceTimersByTime(1 * 60 * 1000);
    });

    expect(mockLock).toHaveBeenCalledTimes(1);
  });

  it("does not call lock() before timeout elapses", () => {
    mockUseWalletStore.mockReturnValue(buildStore({ lockTimeout: 5 }));
    renderHook(() => useAutoLock());

    act(() => {
      jest.advanceTimersByTime(4 * 60 * 1000);
    });

    expect(mockLock).not.toHaveBeenCalled();
  });

  it("does not start timer when wallet is already locked", () => {
    mockUseWalletStore.mockReturnValue(buildStore({ isLocked: true, lockTimeout: 1 }));
    renderHook(() => useAutoLock());

    act(() => {
      jest.advanceTimersByTime(2 * 60 * 1000);
    });

    expect(mockLock).not.toHaveBeenCalled();
  });

  it("resets timer on user activity events", () => {
    mockUseWalletStore.mockReturnValue(buildStore({ lockTimeout: 1 }));
    renderHook(() => useAutoLock());

    // Advance almost to timeout
    act(() => {
      jest.advanceTimersByTime(50 * 1000);
    });

    // Simulate user activity — reset the timer
    act(() => {
      window.dispatchEvent(new Event("mousemove"));
    });

    // Advance another 50s — should NOT lock yet (timer was reset)
    act(() => {
      jest.advanceTimersByTime(50 * 1000);
    });

    expect(mockLock).not.toHaveBeenCalled();

    // Now advance the remaining time past the full timeout
    act(() => {
      jest.advanceTimersByTime(15 * 1000);
    });

    expect(mockLock).toHaveBeenCalledTimes(1);
  });

  it("registers all activity events", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    mockUseWalletStore.mockReturnValue(buildStore());
    renderHook(() => useAutoLock());

    const registeredEvents = addSpy.mock.calls.map((call) => call[0]);
    expect(registeredEvents).toContain("mousemove");
    expect(registeredEvents).toContain("mousedown");
    expect(registeredEvents).toContain("keydown");
    expect(registeredEvents).toContain("touchstart");
    expect(registeredEvents).toContain("scroll");

    addSpy.mockRestore();
  });

  it("removes event listeners on unmount", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener");
    mockUseWalletStore.mockReturnValue(buildStore());
    const { unmount } = renderHook(() => useAutoLock());

    unmount();

    const removedEvents = removeSpy.mock.calls.map((call) => call[0]);
    expect(removedEvents).toContain("mousemove");
    expect(removedEvents).toContain("keydown");

    removeSpy.mockRestore();
  });
});
