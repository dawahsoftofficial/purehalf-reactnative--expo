import { hydrateGroupFields } from './hydrate-group-fields';

const dropdownField = {
  title: 'Body Type',
  type: 'dropDown',
  id: 'bdy-0',
  category: 'appearance-0',
  apiKey: 'body_type_id',
  data: [],
  selected: {},
};

const textField = {
  title: 'About',
  type: 'input',
  id: 'aboutYourself',
  category: 'personality-0',
  apiKey: 'about_you',
  data: [],
  selected: {},
};

describe('hydrateGroupFields', () => {
  it('fills dropdown options from the attribute cache', () => {
    const attribute = {
      'appearance-0': { 'bdy-0': [{ id: 5, value: 'Athletic' }] },
    };
    const [out] = hydrateGroupFields([dropdownField], attribute, {});
    expect(out.data).toEqual([{ id: 5, value: 'Athletic' }]);
    expect(dropdownField.data).toEqual([]); // input not mutated
  });

  it('seeds a dropdown selection from the saved detail value', () => {
    const attribute = {
      'appearance-0': { 'bdy-0': [{ id: 5, value: 'Athletic' }] },
    };
    const [out] = hydrateGroupFields([dropdownField], attribute, {
      body_type_id: 5,
    });
    expect(out.selected).toEqual({ id: 5, value: 'Athletic' });
  });

  it('seeds a text field selection with {id,value,category}', () => {
    const [out] = hydrateGroupFields([textField], {}, { about_you: 'Kind' });
    expect(out.selected).toEqual({
      id: 'aboutYourself',
      value: 'Kind',
      category: 'personality-0',
    });
  });

  it('leaves selected untouched when detail has no value', () => {
    const [out] = hydrateGroupFields([textField], {}, {});
    expect(out.selected).toEqual({});
  });
});
