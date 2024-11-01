import { useEffect, useState } from 'react';

import { HELP_SEEKING_REASONS } from '@/constants/Data';
import { Record } from '@/lib/types';
import { parseArrayStringsToSelectableObjects } from '@/utils';

const useSeekHelp = () => {
  const [helpReasons, setHelpReasons] = useState<Record[] | null>(null);
  const [selectedReason, setSelectedReason] = useState<Record>({});

  useEffect(() => {
    if (helpReasons) return;
    const reasons = parseArrayStringsToSelectableObjects(HELP_SEEKING_REASONS);
    setHelpReasons(reasons);
  }, []);

  return {
    helpReasons,
    selectedReason,
    setSelectedReason,
  };
};

export default useSeekHelp;
