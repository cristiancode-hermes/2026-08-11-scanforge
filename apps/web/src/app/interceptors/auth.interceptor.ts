import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/') && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
    const token = localStorage.getItem('sf_token');
    if (token) {
      return next(req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      }));
    }
  }
  return next(req);
};
