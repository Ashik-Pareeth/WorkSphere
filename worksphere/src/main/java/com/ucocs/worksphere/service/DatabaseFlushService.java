package com.ucocs.worksphere.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class DatabaseFlushService {

    private final EntityManager entityManager;

    public void flushDatabase() {

        var session = entityManager.unwrap(org.hibernate.Session.class);

        session.getSessionFactory()
                .getMetamodel()
                .getEntities()
                .forEach(entity ->
                        entityManager.createQuery("DELETE FROM " + entity.getName())
                                .executeUpdate()
                );

        entityManager.flush();
        entityManager.clear();
    }
}
