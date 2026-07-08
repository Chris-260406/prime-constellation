import numpy as np
import orjson
from numba import njit
import time
import os

@njit
def get_primes_up_to(n):
    """Sieve of Eratosthenes to generate primes up to n."""
    is_prime = np.ones(n + 1, dtype=np.bool_)
    is_prime[0] = False
    is_prime[1] = False
    for p in range(2, int(n**0.5) + 1):
        if is_prime[p]:
            for i in range(p * p, n + 1, p):
                is_prime[i] = False
    return np.nonzero(is_prime)[0]

@njit
def compute_prime_data(primes, target_count):
    """Compute mathematical metadata for the primes."""
    primes = primes[:target_count]
    
    # Residues modulo 6, 44, and 210
    # Casting primes to uint32 since max prime ~ 15.5M fits easily
    primes_u32 = primes.astype(np.uint32)
    r6 = (primes_u32 % 6).astype(np.uint8)
    r44 = (primes_u32 % 44).astype(np.uint8)
    r210 = (primes_u32 % 210).astype(np.uint8)
    
    # Flags for k-tuples
    # 1: has twin (p+2 is prime)
    # 2: has cousin (p+4 is prime)
    # 4: has sexy (p+6 is prime)
    max_p = primes[-1]
    is_prime = np.zeros(max_p + 7, dtype=np.bool_)
    for p in primes:
        is_prime[p] = True
        
    flags = np.zeros(target_count, dtype=np.uint8)
    for i in range(target_count):
        p = primes[i]
        if is_prime[p + 2]:
            flags[i] |= 1
        if is_prime[p + 4]:
            flags[i] |= 2
        if is_prime[p + 6]:
            flags[i] |= 4
            
    return primes_u32, r6, r44, r210, flags

def main():
    target_count = 1_000_000
    # The 1,000,000th prime is 15,485,863. 16,000,000 is safe.
    limit = 16_000_000
    
    print(f"Sieving primes up to {limit}...")
    start_time = time.time()
    all_primes = get_primes_up_to(limit)
    print(f"Found {len(all_primes)} primes in {time.time() - start_time:.3f}s")
    
    if len(all_primes) < target_count:
        raise ValueError("Not enough primes generated. Increase limit.")
        
    print(f"Computing metadata for the first {target_count} primes...")
    start_time = time.time()
    primes, r6, r44, r210, flags = compute_prime_data(all_primes, target_count)
    print(f"Computed metadata in {time.time() - start_time:.3f}s")
    
    print("Serializing to JSON...")
    start_time = time.time()
    
    # We output a columnar format to keep the JSON small and quick to parse in JS.
    data = {
        "p": primes,
        "r6": r6,
        "r44": r44,
        "r210": r210,
        "flags": flags
    }
    
    # orjson handles numpy arrays gracefully with OPT_SERIALIZE_NUMPY
    json_bytes = orjson.dumps(data, option=orjson.OPT_SERIALIZE_NUMPY)
    
    out_dir = "../frontend/public"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "primes_1m.json")
    
    with open(out_path, "wb") as f:
        f.write(json_bytes)
    
    print(f"Serialized to {out_path} in {time.time() - start_time:.3f}s")
    print(f"File size: {len(json_bytes) / 1024 / 1024:.2f} MB")

if __name__ == '__main__':
    main()
