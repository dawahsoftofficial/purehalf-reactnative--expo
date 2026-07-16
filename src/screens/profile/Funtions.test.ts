import { ApiServices } from '../../services';
import { updateDetails } from './Funtions';

jest.mock('../../services', () => ({
  ApiServices: {
    updateDetails: jest.fn(),
  },
}));

describe('updateDetails interests', () => {
  it('saves hobbies through the dedicated interest_id field', async () => {
    (ApiServices.updateDetails as jest.Mock).mockResolvedValue({
      interest_id: ['interest-1', 'interest-9'],
    });

    await updateDetails({
      interestAndHobbies: ['interest-1', 'interest-9'],
    });

    expect(ApiServices.updateDetails).toHaveBeenCalledWith({
      interest_id: ['interest-1', 'interest-9'],
    });
  });
});
