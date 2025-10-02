/*
 * 1.方便做diff 避免无意义的渲染
 * 2.只拷贝变动的节点，其余部分保持引用不变（结构共享）
 * 3.不会意外地“改坏”原始数据
 * 4.创建新结构 属于V8底层的快对象 性能更好
 * 5.hooks + ts + 如上  ahooks变大
 * const [state, setState] = useImmer(function () {
    return { a: 123 };
    });

    const [state1, setState1] = useImmer({ a: 123 });

    const [state1, setState1] = useImmer(5);

    setState(draft => {
    draft.a = 456;
    });
    setState(6)

    setState1=(updater: T | DraftFunction<T>) => {
        if (typeof updater === 'function') {
            updateValue(produce(updater as DraftFunction<T>));
        } else {
            updateValue(freeze(updater));
        }
        }
 */

import { Draft, freeze, produce } from 'immer';
import { useCallback, useState } from 'react';

export type DraftFunction<S> = (draft: Draft<S>) => void;
export type Updater<S> = (arg: S | DraftFunction<S>) => void;
export type ImmerHook<S> = [S, Updater<S>];
//函数签名
export function useImmer<S = unknown>(initialValue: S | (() => S)): ImmerHook<S>;
export function useImmer<T>(initialValue: T) {
  const [val, updateValue] = useState(
    freeze(typeof initialValue === 'function' ? initialValue() : initialValue, true)
  );
  return [
    val,
    useCallback((updater: T | DraftFunction<T>) => {
      if (typeof updater === 'function') {
        //draft 中间可修改草稿
        //   updateValue(produce(val, updater as DraftFunction<T>));
        updateValue(produce(updater as DraftFunction<T>));
      } else {
        //强制更新 loadsh
        updateValue(freeze(updater));
      }
    }, [])
  ];
}

// setState(draft => {
//     draft.a = 456;
// });
