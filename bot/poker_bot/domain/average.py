from poker_bot.domain.cards import CardValue

NUMERIC: tuple[int, ...] = (1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233)


def calculate_average(votes: dict[int, CardValue]) -> float | None:
    nums = [int(v) for v in votes.values() if isinstance(v, int) and v in NUMERIC]
    if not nums:
        return None
    avg = sum(nums) / len(nums)
    return round(avg * 10) / 10
