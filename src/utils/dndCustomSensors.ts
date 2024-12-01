// // CustomSensors.ts
// import { MouseSensor as LibMouseSensor, TouchSensor as LibTouchSensor } from '@dnd-kit/core';
// // import type { MouseSensorProps, TouchSensorProps } from '@dnd-kit/core';

// // Custom handler to check for data-no-dnd attribute
// const handler = ({ nativeEvent: event }: { nativeEvent: MouseEvent | TouchEvent }) => {
//     let cur = event.target as HTMLElement | null;
  
//     while (cur) {
//       if (cur.dataset && cur.dataset.noDnd) {
//         return false; // Prevent DnD activation
//       }
//       cur = cur.parentElement;
//     }
  
//     return true; // Allow DnD activation
//   };

//   export class MouseSensor extends LibMouseSensor {
//     static activators = [{ eventName: 'onMouseDown', handler }] as typeof LibMouseSensor['activators'];
// }

// export class TouchSensor extends LibTouchSensor {
//     static activators = [{ eventName: 'onTouchStart', handler }] as typeof LibTouchSensor['activators'];
// }