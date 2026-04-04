import { Controller, Get, Patch, Post, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get current user statistics' })
  getStats(@CurrentUser() user: JwtPayload) {
    return this.usersService.getStats(user.id);
  }
}
