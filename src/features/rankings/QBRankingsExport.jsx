import React from 'react';
import PropTypes from 'prop-types';
import RankingsExportModal from '@/components/shared/RankingsExportModal';

const QBRankingsExport = ({
  rankings,
  rankingName,
  onClose,
  movementData = {},
  onRankingAdjusted,
}) => {
  return (
    <RankingsExportModal
      rankings={rankings}
      rankingName={rankingName}
      onClose={onClose}
      movementData={movementData}
      title="Export Rankings"
      subtitle="Choose your export format and download your rankings"
      onRankingAdjusted={onRankingAdjusted}
    />
  );
};

QBRankingsExport.propTypes = {
  rankings: PropTypes.array.isRequired,
  rankingName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  movementData: PropTypes.object,
  onRankingAdjusted: PropTypes.func,
};

export default QBRankingsExport;
