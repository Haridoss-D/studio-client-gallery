import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "../services/api";

// Loads data from the API when the page opens.
// Gives you: data, loading, error, and reload() to fetch again.
export default function useLoad(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => {
    setLoading(true);
    fetcher()
      .then((result) => { setData(result); setError(""); })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, deps);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload };
}
