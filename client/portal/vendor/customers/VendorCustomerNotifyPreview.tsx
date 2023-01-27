import { State, useState } from '@hookstate/core';
import Macro from 'client/global/components/Macro';
import * as React from 'react';
import { ReactNode } from 'react';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';

export type NotificationMessageMacros<T extends string> = Array<T>;

export function VendorCustomerNotifyPreview<T extends string>({
  macros,
  messageState,
  children,
  addMacro,
}: {
  children: ReactNode;
  macros: NotificationMessageMacros<T>;
  messageState: State<string>;
  addMacro: (macro: string) => void;
}) {
  const scoped = useState(messageState);

  return (
    <>
      <div className="flex flex-wrap">
        {Object.values(macros).map((v) => (
          <div key={v} className="mb-1 mr-1">
            <Button style={ButtonStyle.TERTIARY} onClick={() => addMacro(v)}>
              {v}
            </Button>
          </div>
        ))}
      </div>
      {children}
      <div className="bg-white rounded-md mt-1 p-2 border bg-gray-50">
        <Macro>{scoped.get() || ''}</Macro>
      </div>
    </>
  );
}
