package org.example.filters;

import jakarta.servlet.*;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;

@WebFilter("/*")
public class CorsFilter implements Filter {

   @Override
   public void init(FilterConfig filterConfig) {}

   @Override
   public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
           throws IOException, ServletException {

       HttpServletRequest request = (HttpServletRequest) req;
       HttpServletResponse response = (HttpServletResponse) res;

       response.setHeader("Access-Control-Allow-Origin", "*");
       response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
       response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
       response.setHeader("Access-Control-Allow-Credentials", "true");

       if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
           response.setStatus(HttpServletResponse.SC_OK);
       } else {
           chain.doFilter(req, res);
       }
   }

   @Override
   public void destroy() {}
}