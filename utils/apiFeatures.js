class APIFeatures {
    constructor(query, queryString){
        this.query = query;
        this.queryString = queryString;
    }

    filter(){
        const queryObj = {...this.queryString};
        const specialFields = ['page', 'sort', 'limit', 'fields'];
        Object.keys(queryObj).forEach(key => {
            if(specialFields.includes(key)) delete queryObj[key];
        })

        const queryString = JSON.stringify(queryObj).replace(/\b(gte|gt|lte|lt)\b/g, (match)=>`$${match}`)
        this.query.find(JSON.parse(queryString));
        return this;
    }
    sort(){
        if (this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query.sort(sortBy);
        } else{
            const defaultSort = '-createdAt';
            this.query.sort(defaultSort);
        }
        return this;
    }
    fields(){
        if (this.queryString.fields){
            const fields = this.queryString.fields.split(',').join(' ');
            this.query.select(fields);
        } else{
            const excludeField = '-__v';
            this.query.select(excludeField);
        }
        return this;
    }
    paginate(){
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit || 100;
        const skip = (page - 1) * limit;

        this.query.skip(skip).limit(limit);
        return this;
    }

}

module.exports = APIFeatures;