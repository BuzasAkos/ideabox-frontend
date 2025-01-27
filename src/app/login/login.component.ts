import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    protected authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.logout();
    this.initForms();
  }

  initForms() {
    this.loginForm = this.formBuilder.group({
      name: ["", [Validators.required, Validators.maxLength(20)]],
    });
  }

  submitLogin() {
    localStorage.setItem('ideaBox_user', this.loginForm.value.name);
    this.router.navigateByUrl('ideabox');
  }

}
