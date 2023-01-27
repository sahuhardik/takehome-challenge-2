import * as React from 'react';
import { ReactNode } from 'react';

export interface BuyerToolbarProps {
  title: string;
  children: ReactNode;
  actions?: React.ReactNode[] | (() => React.ReactNode[]) | React.ReactNode;
}

export function BuyerToolbar({ title, children, actions }: BuyerToolbarProps) {
  const side = typeof actions === 'function' ? actions() : actions;
  return (
    <>
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 leading-none">{title}</h1>
        <div>{side}</div>
      </div>
      {children}
    </>
  );
}
