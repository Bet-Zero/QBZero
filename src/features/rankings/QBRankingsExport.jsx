import React from 'react';
import RankingsExportModal from '@/components/shared/RankingsExportModal';

const QBRankingsExport = ({
  rankings,
  rankingName,
  onClose,
  movementData = {},
}) => {
  return (
    <RankingsExportModal
      rankings={rankings}
      rankingName={rankingName}
      onClose={onClose}
      movementData={movementData}
      title="Export Rankings"
      subtitle="Choose your export format and download your rankings"
    />
  );
};

export default QBRankingsExport;