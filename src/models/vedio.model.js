import mongoose ,{Schema}from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const vedioSchema = new Schema(
    {
        vedioFile:{
            type:String,
            required:true
        },
        thumbnail:{
            type:String,
            required:true
        },
        title:{
            type:String,
            required:true
        }, 
        descreption:{
            type:String,
            required:true
        },
        duration:{
            type:Number,
            required :true
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean
        } ,
        owner:{
            type:Schema.Types.ObjectId,
            ref:"user"
        }
    },{
        timestamps:true
    })
vedioSchema.plugin(mongooseAggregatePaginate)
export const vedio =mongoose.model("vedio",vedioSchema)