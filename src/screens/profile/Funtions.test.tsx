import { ApiServices } from '../../services';
import { updateDetails } from './Funtions';

jest.mock('../../services', () => ({
  ApiServices: {
    updateDetails: jest.fn(),
  },
}));

describe('updateDetails', () => {
  it('sends the preferred height display unit separately from canonical cm', async () => {
    (ApiServices.updateDetails as jest.Mock).mockResolvedValue({ ok: true });

    await updateDetails([
      {
        id: 'height',
        category: 'appearance-0',
        selected: { value: 178, scale: 'cm', displayScale: 'ft' },
      },
    ]);

    expect(ApiServices.updateDetails).toHaveBeenCalledWith({
      height: 178,
      height_scale: 'cm',
      height_display_scale: 'ft',
    });
  });
});
