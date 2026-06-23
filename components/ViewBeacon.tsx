"use client";

import { useEffect, useRef } from "react";

/**
 * ラボ詳細の閲覧数を加算するビーコン。
 *
 * ラボ詳細は ISR キャッシュするため、サーバー描画時に viewCount を増やせない
 * （キャッシュ中はレンダリングが走らない）。代わりにクライアントから API を
 * 1 回だけ叩いて加算する。人気順ソートのためのゆるい計測なので、失敗は無視する。
 */
export function ViewBeacon({ labId }: { labId: number }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fetch(`/api/labs/${labId}/view`, { method: "POST", keepalive: true }).catch(
      () => {},
    );
  }, [labId]);
  return null;
}
