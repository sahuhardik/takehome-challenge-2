import SlidebarOpenButton from 'client/global/components/button/SlidebarOpenButton';
import LineItemSlidebar from 'client/portal/vendor/components/LineItemSlidebar';
import * as React from 'react';

export default function AddLineItem() {
  return (
    <SlidebarOpenButton button="Add Line Item">
      <LineItemSlidebar line={{ id: '' }} add />
    </SlidebarOpenButton>
  );
}
