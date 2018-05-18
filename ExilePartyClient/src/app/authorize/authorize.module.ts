import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthorizeComponent } from './authorize.component';
import { ProfileModule } from './profile/profile.module';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { PartyModule } from './party/party.module';

@NgModule({
  imports: [
    CommonModule,
    ProfileModule,
    RouterModule,
    PartyModule,
    MatSidenavModule
  ],
  declarations: [AuthorizeComponent]
})
export class AuthorizeModule { }
