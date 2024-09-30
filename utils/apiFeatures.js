class APIFeatures {
    constructor(query,queryStr){//query is e.g productModel.find() queryStr is the string we want to find
        this.query = query;
        this.queryStr = queryStr;
    }

    search(){
        const keyword = this.queryStr.keyword?//also req.query.keyword
        {
            name: {$regex: this.queryStr.keyword , $options: "i"}//i means it shouldnt be case sensitive
        }
        :{}; 

        this.query = this.query.find({...keyword});
        return this;
    }

    filter(){
        const queryCopy = {...this.queryStr}/*
        this is an object e.g api/product?keyword=apple&category=food
        the query object is {keyword:apple,category:food}
        */
       const removeFields = ['keyword',"limit",'page']// because these arent part of keys in the database we have to remove them so it wont affect our query
        removeFields.forEach(removeField=> delete queryCopy[removeField])

        //Advance filter for price rating etc
        let queryStr = JSON.stringify(queryCopy);//converts the query to String
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g,match=> `$${match}`)
        /**
         * it then uses the replace method to find gt gte lt and lte in the string
         * when found it takes those values but instead of replacing a dollar sign is
         * added to it
         *  {
                price: {$gte: 10 , $lte: 100}
            }
            this command finds the prices greater or equal to 10 but less than or equal to 100
         */

        this.query = this.query.find(JSON.parse(queryStr));
        console.log(queryStr);
        return this;
    }

    pagination(resultsPerPage){
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resultsPerPage * (currentPage-1);

        this.query = this.query.limit(resultsPerPage).skip(skip)
        return this;
    }

}

export default APIFeatures;