/* eslint-disable @typescript-eslint/no-explicit-any */
import _ from 'lodash';

// Merge cached ATTRIBUTE option lists + the user's saved detail values into a
// group's field definitions. Mirrors Profile.tsx getAttribute per-field rules
// exactly, but as a pure function over a single group's fields. Never mutates
// its inputs (deep-clones first).
export const hydrateGroupFields = (
  fields: any[] = [],
  attribute: any = {},
  detail: any = {}
): any[] => {
  const clone: any[] = JSON.parse(JSON.stringify(fields ?? []));

  clone.forEach((element: any) => {
    // 1) Options for dropDown fields come from attribute[category][id].
    const options = attribute?.[element.category]?.[element.id];
    if (options) {
      element.data = options;
    }

    // 2) Seed selected from the saved detail value (if present).
    if (detail && Object.keys(detail).length !== 0) {
      const value = detail?.[element.apiKey];
      if (value === null || value === undefined) return;

      if (element.type === 'dropDown') {
        const match = _.find(element?.data, (n: any) => n?.id === value);
        if (match) {
          element.selected = match;
        } else if (element.id === 'language' || element.id === 'nationality') {
          element.selected = {
            id: (value as any)?.id,
            value: (value as any)?.name,
          };
        }
      } else if (element.type === 'scalling') {
        if (element.id === 'height') {
          element.selected = {
            scale: detail?.height_scale,
            value: detail?.height,
          };
        } else {
          element.selected = {
            scale: detail?.weight_scale,
            value: detail?.weight,
          };
        }
      } else {
        element.selected = {
          id: element?.id,
          value,
          category: element?.category,
        };
      }
    }
  });

  return clone;
};
