import { ApiServices } from '../../services';

const updateDetails = async (data: any) => {
  return new Promise(async (resolve, reject) => {
    const params: any = {};
    if (data[0]?.category === 'appearance-0') {
      for await (const element of data) {
        if (Object.keys(element?.selected).length !== 0) {
          if (element.id === 'height') {
            params.height = element.selected.value;
            params.height_scale = element.selected.scale;
            params.height_display_scale =
              element.selected.displayScale ?? element.selected.scale;
          } else if (element.id === 'weight') {
            params.weight = element.selected.value;
            params.weight_scale = element.selected?.scale;
          } else if (element.id === 'dis-0') {
            params.disability_id = element.selected.id;
          } else if (element.id === 'bdy-0') {
            params.body_type_id = element.selected.id;
          } else if (element.id === 'eye-0') {
            params.eyes_color_id = element.selected.id;
          } else if (element.id === 'skin-0') {
            params.skin_tone_id = element.selected.id;
          }
        }
      }
    } else if (data[0]?.category === 'familybg-0') {
      for await (const element of data) {
        if (Object.keys(element?.selected).length !== 0) {
          if (element.id === 'ethini-0') {
            params.ethinicity_id = element.selected.id;
          } else if (element.id === 'language') {
            params.language_id = element.selected.id;
          } else if (element.id === 'nationality') {
            params.nationality_id = element.selected.id;
          } else if (element.id === 'caste') {
            params.caste = element.selected.value;
          } else if (element.id === 'countryRestriction') {
            params.country_restriction = element.selected.value;
          } else if (element.id === 'languageRestriction') {
            params.language_restriction = element.selected.value;
          } else if (element.id === 'nationalityRestriction') {
            params.nationality_restriction = element.selected.value;
          } else if (element.id === 'casteRestriction') {
            params.caste_restriction = element.selected.value;
          }
        }
      }
    } else if (data[0]?.category === 'life-0') {
      for await (const element of data) {
        if (Object.keys(element?.selected).length !== 0) {
          if (element.id === 'edu-0') {
            params.education_level_id = element.selected.id;
          } else if (element.id === 'prof-0') {
            params.profession_id = element.selected.id;
          } else if (element.id === 'earn-0') {
            params.earnings_per_month_id = element.selected.id;
          } else if (element.id === 'martial-0') {
            params.maritial_status_id = element.selected.id;
          } else if (element.id === 'haveChildren') {
            params.have_children = element.selected.value;
          } else if (element.id === 'foodAllergies') {
          } else if (element.id === 'smoke-0') {
            params.smoking_id = element.selected.id;
          } else if (element.id === 'drink-0') {
            params.drinking_id = element.selected.id;
          } else if (element.id === 'doYouOwnACar') {
            params.have_car = element.selected.value;
          } else if (element.id === 'doYouOwnABusiness') {
            params.have_business = element.selected.value;
          } else if (element.id === 'doYouKeepPets') {
            params.have_pets = element.selected.value;
          } else if (element.id === 'doYouOwnAHouse') {
            params.have_house = element.selected.value;
          }
        }
      }
    } else if (data[0]?.category === 'personality-0') {
      for await (const element of data) {
        if (Object.keys(element?.selected).length !== 0) {
          if (element.id === 'aboutYourself') {
            params.about_you = element.selected.value;
          } else if (element.id === 'aboutPartner') {
            params.about_partner = element.selected.value;
          } else if (element.id === 'likes') {
            params.likes = element.selected.value;
          } else if (element.id === 'disLikes') {
            params.dislikes = element.selected.value;
          } else if (element.id === 'openForPolygamy') {
            params.open_for_polygamy = element.selected.value;
          }
        }
      }
    } else if (data[0]?.category === 'wali-0') {
      for await (const element of data) {
        if (Object.keys(element?.selected).length !== 0) {
          if (element.id === 'firstName') {
            params.wali_first_name = element.selected.value;
          } else if (element.id === 'lastName') {
            params.wali_last_name = element.selected.value;
          } else if (element.id === 'phoneNumber') {
            params.wali_phone = element.selected.value;
          } else if (element.id === 'email') {
            params.wali_email = element.selected.value;
          }
        }
      }
    } else if (data[0]?.category === 'islamicval-0') {
      for await (const element of data) {
        if (Object.keys(element?.selected).length !== 0) {
          if (element.id === 'pray-0') {
            params.prayers_punctuality_id = element.selected.id;
          } else if (element.id === 'hijab-0') {
            params.hijab_level_id = element.selected.id;
          } else if (element.id === 'doYouHaveABeard') {
            params.have_beard = element.selected.value;
          } else if (element.id === 'islam-0') {
            params.islamic_practice_level_id = element.selected.id;
          } else if (element.id === 'sect-0') {
            params.sect_id = element.selected.id;
          } else if (element.id === 'muslim-0') {
            params.is_new_muslim = element.selected.value;
          }
        }
      }
    } else if (data[0]?.category === 'futureplan-0') {
      for await (const element of data) {
        if (Object.keys(element?.selected).length !== 0) {
          if (element.id === 'familyplan-0') {
            params.family_plan_id = element.selected.id;
          } else if (element.id === 'marriageplan-0') {
            params.marriage_plan_id = element.selected.id;
          } else if (element.id === 'relocationplan-0') {
            params.relocation_plan_id = element.selected.id;
          }
        }
      }
    } else if (data?.interestAndHobbies) {
      params.interest_id = data.interestAndHobbies;
    }
    ApiServices.updateDetails(params)
      .then(async (res) => {
        resolve(res);
      })
      .catch(() => reject(''));
  });
};

export { updateDetails };
