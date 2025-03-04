const handleEnterKey = (e, callback) => {
    if (e.key === 'Enter' || e.key === 'NumpadEnter') {
        callback();
    }
};

export default handleEnterKey