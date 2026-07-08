package com.travelai.blog;

import com.travelai.blog.dto.BlogPostResponse;
import com.travelai.shared.domain.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/blog")
@RequiredArgsConstructor
public class BlogController {

    private final BlogPostRepository repository;

    @GetMapping("/posts")
    public ApiResponse<List<BlogPostResponse>> getPosts() {
        List<BlogPostResponse> posts = repository.findByActiveTrueOrderBySortOrderAsc().stream()
                .map(p -> new BlogPostResponse(
                        p.getId(), p.getSlug(), p.getTitle(), p.getExcerpt(), p.getCategory(),
                        p.getReadMin(), p.getDateLabel(), p.getIcon(), p.getAccent(), p.isFeatured()))
                .toList();
        return ApiResponse.ok(posts);
    }
}
