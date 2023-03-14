export function Pattern(pattern, centroGrid) {
   const cx = centroGrid.x;
   const cy = centroGrid.y;
   let coords = [];
   
   // Lista de patrones
   switch(pattern) {
      case 'rip-conway':
         coords = [
            {x:cx-1, y:cy-4}, {x:cx+0, y:cy-4}, {x:cx+1,y:cy-4},
            {x:cx-1, y:cy-3}, {x:cx+1, y:cy-3},
            {x:cx-1, y:cy-2}, {x:cx+1, y:cy-2},
            {x:cx-0, y:cy-1},
            {x:cx-3, y:cy+0}, {x:cx-1, y:cy+0}, {x:cx+0, y:cy+0}, {x:cx+1, y:cy+0},
            {x:cx-2, y:cy+1}, {x:cx-0, y:cy+1}, {x:cx+2, y:cy+1},
            {x:cx-0, y:cy+2}, {x:cx+3, y:cy+2},
            {x:cx-1, y:cy+3}, {x:cx+1, y:cy+3},
            {x:cx-1, y:cy+4}, {x:cx+1, y:cy+4}
         ];
      break;

      case 'spaceship':
         coords = [
            {x:cx-1, y:cy-2}, {x:cx+0, y:cy-2}, {x:cx+1, y:cy-2}, {x:cx+2, y:cy-2},
            {x:cx-2, y:cy-1}, {x:cx+2, y:cy-1},
            {x:cx+2, y:cy+0},
            {x:cx-2, y:cy+1}, {x:cx+1, y:cy+1}
         ];
      break;

      case 'gosper-gun':
         coords = [
            {x:cx+5, y:cy-7}, {x:cx+6, y:cy-7}, {x:cx+16, y:cy-7}, {x:cx+17, y:cy-7},
            {x:cx+4, y:cy-6}, {x:cx+6, y:cy-6}, {x:cx+16, y:cy-6}, {x:cx+17, y:cy-6},
            {x:cx-18, y:cy-5}, {x:cx-17, y:cy-5}, {x:cx-9, y:cy-5}, {x:cx-8, y:cy-5}, {x:cx+4, y:cy-5}, {x:cx+5, y:cy-5},
            {x:cx-18, y:cy-4}, {x:cx-17, y:cy-4}, {x:cx-10, y:cy-4}, {x:cx-8, y:cy-4},
            {x:cx-10, y:cy-3}, {x:cx-9, y:cy-3}, {x:cx-2, y:cy-3}, {x:cx-1, y:cy-3},
            {x:cx-2, y:cy-2}, {x:cx-0, y:cy-2},
            {x:cx-2, y:cy-1},
            {x:cx+17, y:cy-0}, {x:cx+18, y:cy-0},
            {x:cx+17, y:cy+1}, {x:cx+19, y:cy+1},
            {x:cx+17, y:cy+2},
            {x:cx+6, y:cy+5}, {x:cx+7, y:cy+5}, {x:cx+8, y:cy+5},
            {x:cx+6, y:cy+6},
            {x:cx+7, y:cy+7}
         ];
      break;
   }
   return coords;
}
