using System;

namespace api.Dtos;

public class RankingResultDto
{
    public int OptionId { get; set; }
    public string Text { get; set; } = string.Empty;
    public List<RankDistributionDto> RankDistribution { get; set; } = new List<RankDistributionDto>();

}
