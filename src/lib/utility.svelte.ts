export function debounce<T>(f: (...args: T[]) => unknown, ms: number) {
  let id: null | NodeJS.Timeout = null;
  return (...args: T[]) => {
    if (id) {
      clearTimeout(id);
    }
    id = setTimeout(() => {
      f(...args);
    }, ms);
  };
}

export function debounced<T>(stateGetter: () => T, ms: number) {
  let state = $state(stateGetter());
  const update = debounce<T>((v) => (state = v), ms);
  $effect(() => update(stateGetter()));

  return () => state;
}

export function gcd(a: number, b: number): number {
    let smaller = Math.min(a, b);
    let hcf = 1;

    for (let i = 1; i <= smaller; i++) {
        if (a % i === 0 && b % i === 0) {
            hcf = i;
        }
    }

    return hcf;
}

export function lcm(a: number, b: number): number {
    return (a * b) / gcd(a, b);   
}
