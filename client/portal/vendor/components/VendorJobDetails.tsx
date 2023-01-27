import { DescriptionListItem } from 'client/global/components/tailwind/DescriptionList';
import * as React from 'react';
import { VendorJobDetailsComponentDocument } from 'shared/generated';
import { useQueryHook } from 'shared/Graph';

export function VendorJobDetailsProperty({ display }: { display: string }) {
  const list = display.trim().split('\n\n');

  if (list.length === 0) {
    const lines = list[0].split('\n');

    if (lines.length === 1) {
      return <>{lines[0]}</>;
    }

    return (
      <>
        {lines.map((s) => (
          <div key={s}>{s}</div>
        ))}
      </>
    );
  }

  return (
    <div className="space-y-3 divide-content">
      {list.map((l) => (
        <div key={l}>
          {l.split('\n').map((s) => (
            <div key={s}>{s}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function VendorJobDetails({ jobId }: { jobId: string }) {
  const results = useQueryHook(VendorJobDetailsComponentDocument, { jobId }, 'no-cache');

  return (
    <div>
      {results.orderJob.properties.map((p) => (
        <DescriptionListItem name={p.property.name} key={p.property.name}>
          <VendorJobDetailsProperty display={p.display} />
        </DescriptionListItem>
      ))}
    </div>
  );
}
