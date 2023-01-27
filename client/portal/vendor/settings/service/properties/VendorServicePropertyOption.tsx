import { none, State, useState } from '@hookstate/core';
import Slidebar, { SlidebarContent, SlidebarHeader } from 'client/global/layout/slidebar/Slidebar';
import VendorServicePropertyOptionForm from 'client/portal/vendor/settings/service/properties/VendorServicePropertyOptionForm';
import * as React from 'react';
import { useRef } from 'react';
import { useDrag, useDrop, XYCoord } from 'react-dnd';
import { DragObjectWithType } from 'react-dnd/lib/interfaces';
import Button from 'shared/components/tailwind/Button';
import { ButtonStyle } from 'shared/components/tailwind/Button/ButtonViewCommon';
import { PerformablePropertyValueWrite, PerformablePropertyWrite } from 'shared/generated';
import DeleteIcon from 'shared/icons/DeleteIcon';
import MoveIcon from 'shared/icons/MoveIcon';

interface Props {
  title: string;
  value: State<PerformablePropertyValueWrite>;
  property: State<PerformablePropertyWrite>;
  move: (from: number, to: number) => void;
  index: number;
}

export default function VendorServicePropertyOption({ value, property, index, title, move }: Props) {
  const state = useState(value);
  const show = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop<DragObjectWithType & { index: number }, undefined, undefined>({
    accept: 'option',
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;

      // Don't replace items with themselves
      if (dragIndex === index) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < index && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > index && hoverClientY > hoverMiddleY) {
        return;
      }

      move(dragIndex, index);

      item.index = index;
    },
  });

  const [, drag] = useDrag({
    item: { type: 'option', index },
  });

  drag(drop(ref));

  return (
    <div>
      <Slidebar show={show.get()} onClose={() => show.set(false)}>
        <SlidebarHeader title={title} />
        <SlidebarContent>
          <VendorServicePropertyOptionForm state={state} property={property} />
          <Button onClick={() => show.set(false)}>Close</Button>
        </SlidebarContent>
      </Slidebar>
      <div ref={ref} className="bg-content round shadow p-4 flex items-center">
        <div className="w-4 h-4 mr-2 cursor-move">
          <MoveIcon />
        </div>
        <div className="flex-1 cursor-pointer" onClick={() => show.set(true)}>
          {state.name.get()}
        </div>
        <Button
          icon={<DeleteIcon />}
          style={ButtonStyle.DANGER}
          onClick={(e) => {
            e.preventDefault();

            state.set(none);
          }}
        ></Button>
      </div>
    </div>
  );
}
