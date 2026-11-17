import { autoUpdate, computePosition, hide, flip, arrow, offset, detectOverflow, shift, autoPlacement, limitShift } from '../../node_modules/@floating-ui/dom/dist/floating-ui.dom.js';

const flippedPlacement = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

function preferredOffset(preferredPlacement, layoutOffsets, isRTL) {
  return offset((state) => {
    const { rects: { reference, floating }, ...rest } = state;
    let crossOffset;
    const horizontalOffset = layoutOffsets.buttonOffsetX + layoutOffsets.flyoutOffsetX;
    const verticalOffset = layoutOffsets.buttonOffsetY + layoutOffsets.flyoutOffsetY;
    if (preferredPlacement === 'left' && (rest.placement === 'top' || rest.placement === 'bottom')) {
      crossOffset = -floating.width / 2 - reference.width / 2 + horizontalOffset;
      if (state.middlewareData.buttonOverflow.left > 0) {
        crossOffset += state.middlewareData.buttonOverflow.left;
      }
      if (isRTL) {
        crossOffset = -crossOffset;
      }
    } else if (preferredPlacement === 'right' && (rest.placement === 'top' || rest.placement === 'bottom')) {
      crossOffset = floating.width / 2 + reference.width / 2 - horizontalOffset;
      if (state.middlewareData.buttonOverflow.right > 0) {
        crossOffset -= state.middlewareData.buttonOverflow.right;
      }
      if (isRTL) {
        crossOffset = -crossOffset;
      }
    } else if (preferredPlacement === 'top' && (rest.placement === 'left' || rest.placement === 'right')) {
      crossOffset = -floating.height / 2 - reference.height / 2 + verticalOffset;
      if (state.middlewareData.buttonOverflow.top > 0) {
        crossOffset += state.middlewareData.buttonOverflow.top;
      }
    } else if (preferredPlacement === 'bottom' && (rest.placement === 'left' || rest.placement === 'right')) {
      crossOffset = floating.height / 2 + reference.height / 2 - verticalOffset;
      if (state.middlewareData.buttonOverflow.bottom > 0) {
        crossOffset -= state.middlewareData.buttonOverflow.bottom;
      }
    }
    return {
      mainAxis: layoutOffsets.placementOffset,
      crossAxis: crossOffset,
    };
  });
}

function restrictedShift(layoutOffsets) {
  return shift({
    limiter: limitShift({
      offset: (state) => {
        const { placement } = state;
        const offsets = {};
        if (placement.startsWith('top') || placement.startsWith('bottom')) {
          offsets.mainAxis = layoutOffsets.buttonOffsetX + layoutOffsets.flyoutOffsetX;
        } else if (placement.startsWith('left') || placement.startsWith('right')) {
          offsets.mainAxis = layoutOffsets.buttonOffsetY + layoutOffsets.flyoutOffsetY;
        }
        return offsets;
      },
    }),
  });
}

function flyoutOverflow() {
  return {
    name: 'flyoutOverflow',
    async fn(state) {
      const overflow = await detectOverflow(state, { elementContext: 'floating' });
      state.middlewareData.flyoutOverflow = overflow;
      return {};
    },
  };
}

function buttonOverflow() {
  return {
    name: 'buttonOverflow',
    async fn(state) {
      const overflow = await detectOverflow(state, { elementContext: 'reference' });
      state.middlewareData.buttonOverflow = overflow;
      return {};
    },
  };
}

// get the placements, where the arrow peak pointing to the button is not hidden
function getPossiblePlacements(buttonOverflows, hiddenOffsets, layoutOffsets) {
  const possiblePlacements = {};
  let count = 0;
  // first check edges on button where triangle contact point is visible
  // and take these edges as possible placements
  const offsetX = layoutOffsets.buttonOffsetX;
  const offsetY = layoutOffsets.buttonOffsetY;

  if (hiddenOffsets.right < -offsetX && hiddenOffsets.left < -offsetX) {
    if (buttonOverflows.top <= 0) {
      possiblePlacements.top = true;
      count += 1;
    }
    if (buttonOverflows.bottom <= 0) {
      possiblePlacements.bottom = true;
      count += 1;
    }
  }
  if (hiddenOffsets.bottom < -offsetY && hiddenOffsets.top < -offsetY) {
    if (buttonOverflows.right <= 0) {
      possiblePlacements.right = true;
      count += 1;
    }
    if (buttonOverflows.left <= 0) {
      possiblePlacements.left = true;
      count += 1;
    }
  }
  if (!count) {
    possiblePlacements.hidden = true;
    // if there are no edges, where triangle contact point is visible,
    // take the edges opposite to the overflow edges.
    if (hiddenOffsets.bottom >= -offsetY) {
      possiblePlacements.top = true;
      count += 1;
    }
    if (hiddenOffsets.right >= -offsetX) {
      possiblePlacements.left = true;
      count += 1;
    }
    if (hiddenOffsets.top >= -offsetY) {
      possiblePlacements.bottom = true;
      count += 1;
    }
    if (hiddenOffsets.left >= -offsetX) {
      possiblePlacements.right = true;
      count += 1;
    }
  }
  possiblePlacements.count = count;
  return possiblePlacements;
}

function checkPlacement(allowedPlacements, layoutOffsets) {
  const result = {
    name: 'checkPlacement',
    fn: async function fn(state) {
      const hiddenOffsets = state.middlewareData.hide?.referenceHiddenOffsets;
      const buttonOverflows = state.middlewareData.buttonOverflow;
      if (hiddenOffsets && buttonOverflows) {
        const possiblePlacements = getPossiblePlacements(buttonOverflows, hiddenOffsets, layoutOffsets);
        if (!possiblePlacements[state.placement] && possiblePlacements.count > 0) {
          let firstPossible;
          let nextPossible;
          let currentFound;
          for (let ii = 0; ii < allowedPlacements.length; ii += 1) {
            const placement = allowedPlacements[ii];
            const possible = possiblePlacements[placement];
            if (possible) {
              if (currentFound) {
                nextPossible = placement;
                break;
              }
              if (!firstPossible) {
                firstPossible = placement;
              }
            }
            if (!currentFound) {
              currentFound = placement === state.placement;
            }
          }
          if (!nextPossible) {
            nextPossible = firstPossible;
          }
          return {
            reset: {
              placement: nextPossible,
            },
          };
        }
      }
      return {};
    },
  };
  return result;
}

function determinePlacements(layoutOffsets) {
  const result = {
    name: 'determinePlacements',
    fn: async function fn(state) {
      const hiddenOffsets = state.middlewareData.hide.referenceHiddenOffsets;
      const buttonOverflows = state.middlewareData.buttonOverflow;
      if (hiddenOffsets && buttonOverflows) {
        const possiblePlacements = getPossiblePlacements(buttonOverflows, hiddenOffsets, layoutOffsets);
        state.middlewareData.determinePlacements = {
          possiblePlacements,
        };
      }
      return {};
    },
  };
  return result;
}

function controlledAutoPlacement(allowedPlacements) {
  const orig = autoPlacement((state) => {
    const { middlewareData: { determinePlacements: { possiblePlacements } } } = state;
    const filteredPlacements = allowedPlacements.filter(placement => possiblePlacements[placement]);
    return {
      allowedPlacements: filteredPlacements,
    };
  });
  const result = {
    name: 'autoPlacement',
    fn: async function fn(state) {
      const fnresult = await orig.fn(state);
      return fnresult;
    },
  };
  return result;
}

function checkArrow(triangle, layoutOffsets) {
  const result = {
    name: 'checkArrow',
    fn: async function fn(state) {
      let { x: arrowX, y: arrowY } = state.middlewareData.arrow;
      const buttonRect = state.rects.reference;
      const flyoutRect = state.rects.floating;
      const hiddenOffsets = state.middlewareData.hide.referenceHiddenOffsets;
      const checked = {};
      if (arrowY != null) {
        const arrowYmax = flyoutRect.height - triangle.offsetHeight / 2 - layoutOffsets.arrowPadding;
        const arrowYmin = layoutOffsets.arrowPadding;
        const overflowYmax = buttonRect.y - hiddenOffsets.bottom - state.y - triangle.offsetHeight / 2;
        const overflowYmin = buttonRect.y + buttonRect.height + hiddenOffsets.top - state.y - triangle.offsetHeight / 2;
        const arrowPeakYmin = buttonRect.y + layoutOffsets.buttonOffsetY - state.y - triangle.offsetHeight / 2;
        const arrowPeakYmax = buttonRect.y + buttonRect.height - layoutOffsets.buttonOffsetX - state.y - triangle.offsetHeight / 2;

        arrowY = Math.max(arrowYmin, Math.min(arrowYmax, arrowY));
        const checkedYmax = Math.max(arrowYmin, arrowPeakYmin, Math.min(arrowYmax, overflowYmax, arrowPeakYmax));
        const checkedYmin = Math.max(arrowYmin, arrowPeakYmin, Math.min(arrowYmax, overflowYmin, arrowPeakYmax));
        if (arrowY > checkedYmax) {
          arrowY = checkedYmax;
          checked.y = arrowY;
        }
        if (arrowY < checkedYmin) {
          arrowY = checkedYmin;
          checked.y = arrowY;
        }
      }
      if (arrowX != null) {
        const arrowXmax = flyoutRect.width - triangle.offsetHeight / 2 - layoutOffsets.arrowPadding;
        const arrowXmin = layoutOffsets.arrowPadding;
        const overflowXmax = buttonRect.x - hiddenOffsets.right - state.x - triangle.offsetWidth / 2;
        const overflowXmin = buttonRect.x + buttonRect.width + hiddenOffsets.left - state.x - triangle.offsetWidth / 2;
        const arrowPeakXmin = buttonRect.x + layoutOffsets.buttonOffsetX - state.x - triangle.offsetWidth / 2;
        const arrowPeakXmax = buttonRect.x + buttonRect.width - layoutOffsets.buttonOffsetX - state.x - triangle.offsetWidth / 2;

        arrowX = Math.max(arrowXmin, Math.min(arrowXmax, arrowX));
        const checkedXmax = Math.max(arrowXmin, arrowPeakXmin, Math.min(arrowXmax, overflowXmax, arrowPeakXmax));
        const checkedXmin = Math.max(arrowXmin, arrowPeakXmin, Math.min(arrowXmax, overflowXmin, arrowPeakXmax));
        if (arrowX > checkedXmax) {
          arrowX = checkedXmax;
          checked.x = arrowX;
        }
        if (arrowX < checkedXmin) {
          arrowX = checkedXmin;
          checked.x = arrowX;
        }
      }
      state.middlewareData.checkArrow = checked;
      return {};
    },
  };
  return result;
}

function getLayoutOffsets(button, flyout, triangle, options) {
  const layoutOffset = Math.max(options?.layoutOffset || 0, 0);
  const buttonOffset = Math.max(options?.buttonOffset || 0, 0);
  const flyoutOffset = Math.max(options?.flyoutOffset || 0, 0);

  const arrowOffsetMaxX = flyout.offsetWidth / 2 - triangle.offsetWidth / 2;
  const arrowOffsetMaxY = flyout.offsetHeight / 2 - triangle.offsetHeight / 2;
  const arrowOffset = Math.min(flyoutOffset, arrowOffsetMaxX, arrowOffsetMaxY);

  const flyoutLimitX = Math.min(triangle.offsetWidth / 2 + arrowOffset, flyout.offsetWidth / 2);
  const flyoutLimitY = Math.min(triangle.offsetHeight / 2 + arrowOffset, flyout.offsetHeight / 2);

  const buttonLimitX = Math.min(buttonOffset, button.offsetWidth / 2);
  const buttonLimitY = Math.min(buttonOffset, button.offsetHeight / 2);

  return {
    placementOffset: layoutOffset,
    buttonOffsetX: buttonLimitX,
    buttonOffsetY: buttonLimitY,
    flyoutOffsetX: flyoutLimitX,
    flyoutOffsetY: flyoutLimitY,
    arrowPadding: arrowOffset,
  };
}

class PopoverUtilities {
  static autoUpdate(button, flyout, update) {
    return autoUpdate(button, flyout, update, {
      // we must not autoupdate the flyout position in case of layout shift,
      // because this would result in 2 updates per second, as soon as the flyout
      // is hidden by other elements or if it is scrolled away, even if only partially!
      layoutShift: false,
    });
  }

  /**
   * compute up to 4 property values.
   */
  static getComputedPropertyValues(element, propertyNames) {
    const styleNames = [
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    ];
    if (propertyNames.length > styleNames.length) {
      throw new Error(`More than ${styleNames.length} property names given.`);
    }
    const dummy = document.createElement('div');
    dummy.style.position = 'absolute"';
    dummy.style.visibility = 'hidden"';
    for (let ii = 0; ii < propertyNames.length; ii += 1) {
      dummy.style[styleNames[ii]] = `var(${propertyNames[ii]})`;
    }
    element.appendChild(dummy);
    const computedStyle = window.getComputedStyle(dummy);
    const result = [];
    for (let ii = 0; ii < propertyNames.length; ii += 1) {
      result[ii] = +(computedStyle[styleNames[ii]].replace('px', '') || '') || 0;
    }
    dummy.remove();
    return result;
  }

  /**
   * @param {*} button reference element to display the flyout
   * @param {*} flyout the flyout to display
   * @param {*} triangle triangle to display at the flyout
   * @param {*} options
   *   - isRTL: boolean, if rtl mode is switched on
   *   - openingDirection: string, one of'start', 'end', 'top', 'bottom' or nothing.
   *     gives the preferred opening direction.
   *   - layoutOffset: number, pixels, the layout grows in the opening direction
   *     at the edge where the stripe and triangle is displayed.
   *     must be known in advance to let the floating ui
   *     compute the overflow condition correctly.
   *   - flyoutOffset: number, pixels needed to keep the triangle away
   *     from the flyout side edge to make it appear fully attached
   *     i.e. the border radius of the flyout.
   *     needed to avoid a peak, which would appear due to the
   *     border radius when displaying the triangle on the side edge.
   *     avoiding this parameter would force us to always compute
   *     this constant value from the flyout dimensions.
   *     And worse: we would need to make assumptions on the
   *     inner structuring of the flyout which we want to
   *     avoid to stay flexible when this method can be used.
   *   - buttonOffset: number, pixels needed to keep the triangle peek away
   *     from the button side edge to make it appear fully attached
   */
  static async positionFlyout(button, flyout, triangle, options) {

    const isRTL = options?.isRTL;
    const cssPrefix = options?.cssPrefix || 'ot-flyout';

    const startPlacement = isRTL ? 'right' : 'left';
    const endPlacement = isRTL ? 'left' : 'right';
    let preferredPlacement;
    let allowedPlacements;
    if (options?.openingDirection === 'start') {
      preferredPlacement = startPlacement;
      allowedPlacements = [startPlacement, 'bottom', 'top', endPlacement];
    } else if (options?.openingDirection === 'end') {
      preferredPlacement = endPlacement;
      allowedPlacements = [endPlacement, 'bottom', 'top', startPlacement];
    } else if (options?.openingDirection === 'top') {
      preferredPlacement = 'top';
      allowedPlacements = ['top', endPlacement, startPlacement, 'bottom'];
    } else if (options?.openingDirection === 'bottom') {
      preferredPlacement = 'bottom';
      allowedPlacements = ['bottom', endPlacement, startPlacement, 'top'];
    } else {
      allowedPlacements = [endPlacement, startPlacement, 'bottom', 'top'];
    }

    flyout.classList.remove(`${cssPrefix}-top`, `${cssPrefix}-right`, `${cssPrefix}-bottom`, `${cssPrefix}-left`);

    // set position to bottom right to avoid scrollbars during computation of position
    // and avoid flyout being visible while in the bottom right corner
    flyout.style.position = 'fixed';
    flyout.style.visibility = 'hidden';
    flyout.style.top = '';
    flyout.style.left = '';
    flyout.style.right = '0px';
    flyout.style.bottom = '0px';

    const layoutOffsets = getLayoutOffsets(button, flyout, triangle, options);

    let position;
    if (preferredPlacement) {
      const fallbackPlacements = allowedPlacements;
      const initialPlacement = fallbackPlacements.shift() || preferredPlacement;

      position = await computePosition(button, flyout, {
        strategy: 'fixed',
        placement: initialPlacement,
        middleware: [
          hide({ strategy: 'referenceHidden' }),
          buttonOverflow(),
          preferredOffset(preferredPlacement, layoutOffsets, isRTL),
          restrictedShift(layoutOffsets),
          flip({ fallbackPlacements }),
          checkPlacement(allowedPlacements, layoutOffsets),
          arrow({ element: triangle, padding: layoutOffsets.arrowPadding }),
          flyoutOverflow(),
          hide({ strategy: 'escaped' }),
          checkArrow(triangle, layoutOffsets),
        ],
      });
    } else {
      position = await computePosition(button, flyout, {
        strategy: 'fixed',
        middleware: [
          hide({ strategy: 'referenceHidden' }),
          buttonOverflow(),
          offset(layoutOffsets.placementOffset),
          restrictedShift(layoutOffsets),
          determinePlacements(layoutOffsets),
          controlledAutoPlacement(allowedPlacements),
          arrow({ element: triangle, padding: layoutOffsets.arrowPadding }),
          flyoutOverflow(),
          hide({ strategy: 'escaped' }),
          checkArrow(triangle, layoutOffsets),
        ],
      });
    }
    const {
      x, y, placement, middlewareData,
    } = position;

    const openingPlacement = placement.split('-')[0];

    let hidden;
    // if caller wants flyout stay to hide when button is hidden
    if (options?.overflowStrategy === 'hide' && position.middlewareData.hide) {
      if (position.middlewareData.hide.referenceHidden) {
        hidden = true;
      }
    }

    // now set classes to get flyout displayed for effective opening direction
    flyout.classList.add(`${cssPrefix}-${openingPlacement}`);

    // set correction offsets to get the flyout correctly placed
    const offsets = { top: 0, left: 0 };
    if (openingPlacement === 'bottom') {
      offsets.top = -layoutOffsets.placementOffset;
    } else if (openingPlacement === 'right') {
      offsets.left = -layoutOffsets.placementOffset;
    }

    // if caller wants flyout to stay inside the clipping area while button is hidden
    if (options?.overflowStrategy === 'inset' && position.middlewareData.flyoutOverflow) {
      if (openingPlacement === 'left' && position.middlewareData.flyoutOverflow.right > -triangle.offsetWidth) {
        offsets.left -= position.middlewareData.flyoutOverflow.right + triangle.offsetWidth;
      } else if (openingPlacement === 'right' && position.middlewareData.flyoutOverflow.left > -triangle.offsetWidth) {
        offsets.left += position.middlewareData.flyoutOverflow.left + triangle.offsetWidth;
      } else if (openingPlacement === 'top' && position.middlewareData.flyoutOverflow.bottom > -triangle.offsetHeight) {
        offsets.top -= position.middlewareData.flyoutOverflow.bottom + triangle.offsetHeight;
      } else if (openingPlacement === 'bottom' && position.middlewareData.flyoutOverflow.top > -triangle.offsetHeight) {
        offsets.top += position.middlewareData.flyoutOverflow.top + triangle.offsetHeight;
      }
    }

    // position flyout as computed
    flyout.style.top = `${y + offsets.top}px`;
    flyout.style.left = `${x + offsets.left}px`;
    flyout.style.right = '';
    flyout.style.bottom = '';

    // direction of arrow is the opposite of the opening direction
    const arrowDirection = flippedPlacement[openingPlacement];
    const { style: arrowStyle } = triangle;

    // keep arrow inside flyout boundaries so it appears always fully attached to the flyout
    let { x: arrowX, y: arrowY } = middlewareData.arrow;
    if (middlewareData.checkArrow.x != null) {
      arrowX = middlewareData.checkArrow.x;
    }
    if (middlewareData.checkArrow.y != null) {
      arrowY = middlewareData.checkArrow.y;
    }
    arrowStyle.left = arrowX != null ? `${arrowX}px` : '';
    arrowStyle.top = arrowY != null ? `${arrowY}px` : '';
    arrowStyle.right = '';
    arrowStyle.bottom = '';
    arrowStyle[arrowDirection] = '0px';

    // and make it visible
    if (!hidden) {
      flyout.style.visibility = '';
    }
  }
}

export { PopoverUtilities };
//# sourceMappingURL=popover-utilities.js.map
