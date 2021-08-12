export const formatDate = (dateString) => {
    let date = new Date(dateString);
    return ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear();
}

export const getDaysInBetween = (dateStr1, dateStr2) => {
    const firstDate = new Date(dateStr1);
    const secondDate = new Date(dateStr2);
    const isSameMonthAndYear = firstDate.getMonth() === secondDate.getMonth() && firstDate.getFullYear() === secondDate.getFullYear();
    if (isSameMonthAndYear) {
        return Math.abs(firstDate.getDate() - secondDate.getDate());
    }
    return Math.round(Math.abs((firstDate - secondDate) / (24 * 60 * 60 * 1000)));
}
