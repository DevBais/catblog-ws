import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { PostService } from "./post.service";
import { GetUser } from "../auth/decorator";
import { CreatePostDto, UpdatePostDto } from "./dto";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import {v4 as uuid} from 'uuid'

@Controller("posts")
export class PostController {
  constructor(private postService: PostService, private prismaService: PrismaService) {
  }

  convertToSlugID(title: string): string {
    return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").toLowerCase() + uuid();
  }

  //PUBLIC
  @Get()
  getAllPosts() {
    return this.postService.getAllPosts();
  }

  //PUBLIC
  @Get(":id")
  getPostById(@Param("id") postId: string) {
    return this.postService.getPostsById(postId);
  }


  //PROTECTED
  @UseGuards(AuthGuard("jwt"))
  @Post()
  @UseInterceptors(FileInterceptor("thumbnail", {
    storage: diskStorage({
      destination: "./public/thumbnails",
      filename(req: Request, file: Express.Multer.File, callback: (error: (Error | null), filename: string) => void) {

        const filename = `${uuid()}.jpg`;
        callback(null, filename);
      }
    })
  }))
  createPost(@GetUser("id") userId: number, @Body() dto: CreatePostDto, @UploadedFile() file: Express.Multer.File) {
    const postId: string = this.convertToSlugID(dto.title);
    const filepath: string = `${file.destination.substring(1)}/${file.filename}`;
    return this.postService.createPost(postId, userId, dto, filepath);
  }

  //PROTECTED
  @UseGuards(AuthGuard("jwt"))
  @Put(":id")
  @UseInterceptors(FileInterceptor("thumbnail", {
    storage: diskStorage({
      destination: "./public/thumbnails",
      filename(req: Request, file: Express.Multer.File, callback: (error: (Error | null), filename: string) => void) {

        let filename = undefined;
        if(!req.body['filename'])  return

        filename = `${req.body["filename"]}`;
        callback(null, filename);
      }
    })
  }))
  updatePost(@GetUser("id") userId: number, @Param("id") postId: string, @Body() dto: UpdatePostDto, @UploadedFile() file: Express.Multer.File) {
    let filepath: string = null;
    if(file) {
       filepath = `${file.destination.substring(1)}/${file.filename}`;
    }
    return this.postService.updatePost(userId, postId, dto, filepath);
  }

  //PROTECTED
  @UseGuards(AuthGuard("jwt"))
  @Delete(":id")
  async deletePost(@GetUser("id") userId: number, @Param("id") postId: string) {
    await this.postService.removeThumbnailFile(userId,postId)
    return this.postService.deletePost(userId, postId);
  }
  @UseGuards(AuthGuard("jwt"))
  @Delete("tumbnail/:id")
  async deletePostTumbnail(@GetUser("id") userId: number, @Param("id") postId: string){
    await this.postService.removeThumbnailFile(userId,postId)
    return this.postService.deletePostThumbnail(userId, postId);
  }


}
