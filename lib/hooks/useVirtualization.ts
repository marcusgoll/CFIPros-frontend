import { useState, useEffect, useCallback, useMemo } from "react";

interface UseVirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  itemCount: number;
  overscan?: number;
  scrollTop?: number;
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
}

export function useVirtualization({
  itemHeight,
  containerHeight,
  itemCount,
  overscan = 5,
  scrollTop = 0,
}: UseVirtualizationOptions) {
  const [scrollOffset, setScrollOffset] = useState(scrollTop);

  const totalHeight = useMemo(
    () => itemCount * itemHeight,
    [itemCount, itemHeight]
  );

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollOffset / itemHeight);
    const visibleEnd = Math.min(
      itemCount - 1,
      Math.floor((scrollOffset + containerHeight) / itemHeight)
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(itemCount - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollOffset, itemHeight, containerHeight, itemCount, overscan]);

  const virtualItems = useMemo((): VirtualItem[] => {
    const items: VirtualItem[] = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push({ index: i, start: i * itemHeight, end: (i + 1) * itemHeight });
    }
    return items;
  }, [visibleRange, itemHeight]);

  const offsetY = useMemo(
    () => visibleRange.start * itemHeight,
    [visibleRange.start, itemHeight]
  );

  const handleScroll = useCallback((scrollTop: number) => {
    setScrollOffset(scrollTop);
  }, []);

  return { virtualItems, totalHeight, offsetY, handleScroll };
}

interface UseVirtualGridOptions {
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  itemCount: number;
  columns: number;
  overscan?: number;
  scrollTop?: number;
  scrollLeft?: number;
}

export function useVirtualGrid({
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  itemCount,
  columns,
  overscan = 2,
  scrollTop = 0,
  scrollLeft = 0,
}: UseVirtualGridOptions) {
  const [scrollOffset, setScrollOffset] = useState({ top: scrollTop, left: scrollLeft });

  const rows = Math.ceil(itemCount / columns);
  const totalHeight = rows * itemHeight;
  const totalWidth = columns * itemWidth;

  const visibleRange = useMemo(() => {
    const startRow = Math.floor(scrollOffset.top / itemHeight);
    const endRow = Math.min(
      rows - 1,
      Math.floor((scrollOffset.top + containerHeight) / itemHeight)
    );

    const startCol = Math.floor(scrollOffset.left / itemWidth);
    const endCol = Math.min(
      columns - 1,
      Math.floor((scrollOffset.left + containerWidth) / itemWidth)
    );

    return {
      startRow: Math.max(0, startRow - overscan),
      endRow: Math.min(rows - 1, endRow + overscan),
      startCol: Math.max(0, startCol - overscan),
      endCol: Math.min(columns - 1, endCol + overscan),
    };
  }, [scrollOffset, itemHeight, itemWidth, containerHeight, containerWidth, rows, columns, overscan]);

  const virtualItems = useMemo(() => {
    const items: Array<VirtualItem & { row: number; col: number; x: number; y: number }> = [];
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
        const index = row * columns + col;
        if (index >= itemCount) break;
        items.push({
          index,
          row,
          col,
          start: index,
          end: index + 1,
          x: col * itemWidth,
          y: row * itemHeight,
        });
      }
    }
    return items;
  }, [visibleRange, columns, itemCount, itemWidth, itemHeight]);

  const handleScroll = useCallback((scrollTop: number, scrollLeft: number) => {
    setScrollOffset({ top: scrollTop, left: scrollLeft });
  }, []);

  return { virtualItems, totalHeight, totalWidth, handleScroll };
}

