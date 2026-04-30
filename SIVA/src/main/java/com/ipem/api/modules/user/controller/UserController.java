package com.ipem.api.modules.user.controller;

import com.ipem.api.modules.user.dto.*;
import com.ipem.api.modules.user.model.User;
import com.ipem.api.modules.user.model.enums.Permission;
import com.ipem.api.modules.user.repository.UserRepository;
import com.ipem.api.modules.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository repository;
    private final UserService service;

    public UserController(UserRepository repository, UserService service) {
        this.repository = repository;
        this.service = service;
    }

    //login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid LoginDTO data) {
        var userOpt = repository.findByRegistration(data.registration());

        if (userOpt.isPresent() && userOpt.get().getPassword().equals(data.password())) {
            return ResponseEntity.ok(userOpt.get());
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Incorrect registration or password.");
    }

    //registrar
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterDTO data) {
        try {
            User newUser = service.registerUser(data);
            return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    //listar tecnico
    @GetMapping("/tecnicos")
    public List<User> getTecnicos() {
        return repository.findByPermission(Permission.TECHNICIAN);
    }

    //atualizar tecnico
    @PutMapping("/{registration}")
    public ResponseEntity<?> updateUser(@PathVariable String registration, @RequestBody User data) {

        var userOpt = repository.findById(registration);

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        user.setName(data.getName());
        user.setEmail(data.getEmail());
        user.setPhone(data.getPhone());
        user.setEmployeeStatus(data.getEmployeeStatus());

        repository.save(user);

        return ResponseEntity.ok(user);
    }

    //validação
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public String handleValidationExceptions(MethodArgumentNotValidException ex) {
        return ex.getBindingResult().getAllErrors().get(0).getDefaultMessage();
    }
}