import { useCallback, useEffect, useRef, useState } from 'react';

export type WakeLockStatus = 'unsupported' | 'inactive' | 'active';

const isSupported = () =>
  typeof navigator !== 'undefined' && 'wakeLock' in navigator;

/**
 * Mantém a tela acesa enquanto o componente estiver montado.
 *
 * Nunca lança erro nem exibe aviso por conta própria: wake lock é um recurso
 * de conveniência, então qualquer falha (sem suporte, bateria baixa, aba
 * oculta, permissão negada) apenas deixa `status` diferente de 'active'.
 * Quem usa decide se mostra algo discreto.
 */
export function useWakeLock(enabled = true) {
  const [status, setStatus] = useState<WakeLockStatus>(
    isSupported() ? 'inactive' : 'unsupported'
  );
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const requestingRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const release = useCallback(async () => {
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;
    if (!sentinel) return;
    try {
      await sentinel.release();
    } catch {
      // já liberado pelo navegador
    }
  }, []);

  const request = useCallback(async () => {
    if (!isSupported() || !enabledRef.current) return;
    // evita pedidos concorrentes e duplicados
    if (requestingRef.current || sentinelRef.current) return;
    // o navegador nega pedidos com a aba oculta
    if (document.visibilityState !== 'visible') return;

    requestingRef.current = true;
    try {
      const sentinel = await navigator.wakeLock.request('screen');

      // desmontou/desativou enquanto aguardava
      if (!enabledRef.current) {
        await sentinel.release().catch(() => {});
        return;
      }

      sentinel.addEventListener('release', () => {
        if (sentinelRef.current === sentinel) sentinelRef.current = null;
        setStatus('inactive');
      });
      sentinelRef.current = sentinel;
      setStatus('active');
    } catch (error) {
      // NotAllowedError (bateria baixa, política, falta de gesto) etc.
      setStatus('inactive');
      console.warn('Wake lock indisponível:', error);
    } finally {
      requestingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isSupported()) return;

    if (!enabled) {
      release();
      setStatus('inactive');
      return;
    }

    request();

    // o navegador libera o lock ao ocultar a aba: pedir de novo ao voltar
    const onVisibility = () => {
      if (document.visibilityState === 'visible') request();
    };
    // se o primeiro pedido foi negado por falta de gesto do usuário,
    // qualquer toque na tela tenta de novo
    const onInteraction = () => {
      if (!sentinelRef.current) request();
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('pointerdown', onInteraction);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('pointerdown', onInteraction);
      release();
    };
  }, [enabled, request, release]);

  return { status, isSupported: status !== 'unsupported', request, release };
}
