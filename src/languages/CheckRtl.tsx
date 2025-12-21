import { useGlobalContext } from '../services';
const CheckRtl = () => {
  const { direction } = useGlobalContext();
  return direction === 'rtl' ? true : false;
};

export default CheckRtl;
